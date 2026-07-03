<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\Ledger;
use App\Models\Notification;
use App\Models\User;
use App\Models\ActivityLog;
use App\DTOs\ReportFilterDTO;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Retrieve the materialized dashboard summary.
     * Cached for 60 seconds per user/shop/date-range scope.
     */
    public function getSummary(ReportFilterDTO $dto): array
    {
        $userId  = Auth::id() ?? 0;
        $shopId  = $dto->shop_id ?? 'all';

        // Default to current month if no dates provided
        $startDate = $dto->start_date
            ? Carbon::parse($dto->start_date)->toDateString()
            : Carbon::now()->startOfMonth()->toDateString();

        $endDate = $dto->end_date
            ? Carbon::parse($dto->end_date)->toDateString()
            : Carbon::now()->toDateString();

        $cacheKey = "dashboard_summary_{$userId}_{$shopId}_{$startDate}_{$endDate}";

        return Cache::remember($cacheKey, 60, function () use ($dto, $startDate, $endDate) {

            // Build base queries that respect shop scopes automatically via HasShopAccessScope
            $bookingsQuery = Booking::forCurrentUser();
            $paymentsQuery = Payment::forCurrentUser();
            $expensesQuery = Expense::forCurrentUser();
            $ledgerQuery   = Ledger::forCurrentUser();

            // Apply explicit shop filter if provided
            if ($dto->shop_id) {
                $bookingsQuery->where('shop_id', $dto->shop_id);
                $paymentsQuery->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
                $expensesQuery->where('shop_id', $dto->shop_id);
                $ledgerQuery->where('shop_id', $dto->shop_id);
            }

            // Aggregate base numbers
            $todayBookingsAmt = (float) (clone $bookingsQuery)->whereBetween('booking_date', [$startDate, $endDate])->sum('booking_amount');
            $todayCollectionsAmt = (float) (clone $paymentsQuery)->whereBetween('payment_date', [$startDate, $endDate])->sum('amount');
            $outstandingAmt = (float) (clone $bookingsQuery)->whereBetween('booking_date', [$startDate, $endDate])->sum('remaining_balance');

            // Outstanding Customers
            $outstandingCustomers = (clone $bookingsQuery)
                ->where('remaining_balance', '>', 0)
                ->where('status', '!=', Booking::STATUS_CANCELLED)
                ->orderBy('delivery_date', 'asc')
                ->limit(5)
                ->get()
                ->map(function($b) {
                    $days = 0;
                    if ($b->delivery_date && Carbon::parse($b->delivery_date)->isPast()) {
                        $days = Carbon::now()->diffInDays(Carbon::parse($b->delivery_date));
                    }
                    return [
                        'id' => $b->id,
                        'name' => $b->customer_name ?: 'Unknown',
                        'amount' => (float) $b->remaining_balance,
                        'daysOverdue' => $days
                    ];
                });

            // Activity Log
            $activities = ActivityLog::forCurrentUser()
                ->with('user')
                ->latest()
                ->limit(5)
                ->get()
                ->map(function($log) {
                    $type = 'other';
                    if (str_contains(strtolower($log->module), 'booking')) $type = 'booking';
                    if (str_contains(strtolower($log->module), 'payment')) $type = 'payment';
                    if (str_contains(strtolower($log->module), 'expense')) $type = 'expense';
                    return [
                        'id' => $log->id,
                        'type' => $type,
                        'title' => ucfirst($log->action) . ' ' . $log->module,
                        'description' => 'By ' . ($log->user ? $log->user->name : 'System'),
                        'time' => $log->created_at->toIso8601String(),
                    ];
                });

            // Collections Chart (Last 7 Days from now)
            $last7Days = collect(range(6, 0))->map(fn($d) => Carbon::now()->subDays($d)->toDateString());
            $collectionsRaw = (clone $paymentsQuery)
                ->where('payment_date', '>=', Carbon::now()->subDays(6)->toDateString())
                ->groupBy('payment_date')
                ->selectRaw('payment_date, sum(amount) as total')
                ->pluck('total', 'payment_date');
            
            $chartCollections = $last7Days->map(function($date) use ($collectionsRaw) {
                return [
                    'name' => Carbon::parse($date)->format('D'),
                    'amount' => (float) ($collectionsRaw[$date] ?? 0)
                ];
            })->values();

            // Expense Chart (By Category in Period)
            $expenseRaw = (clone $expensesQuery)
                ->whereBetween('expense_date', [$startDate, $endDate])
                ->groupBy('expense_category_id')
                ->selectRaw('expense_category_id, sum(amount) as total')
                ->with('expenseCategory')
                ->get();
            
            $totalExp = $expenseRaw->sum('total') ?: 1;
            $chartExpenses = $expenseRaw->map(function($e) use ($totalExp) {
                return [
                    'name' => $e->expenseCategory ? $e->expenseCategory->name : 'Uncategorized',
                    'value' => (float) $e->total,
                    'percent' => round(($e->total / $totalExp) * 100)
                ];
            });

            // Monthly Booking Chart (This Year)
            $currentYear = date('Y');
            $monthlyRaw = (clone $bookingsQuery)
                ->whereYear('booking_date', $currentYear)
                ->selectRaw('MONTH(booking_date) as month, sum(booking_amount) as total')
                ->groupBy('month')
                ->pluck('total', 'month');
            
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            $chartMonthly = collect($months)->map(function($m, $i) use ($monthlyRaw) {
                return [
                    'name' => $m,
                    'amount' => (float) ($monthlyRaw[$i + 1] ?? 0)
                ];
            });

            // AI Insights
            $insights = [];
            if ($todayBookingsAmt > 0) $insights[] = "Bookings total AED " . number_format($todayBookingsAmt) . " for this period.";
            if ($todayCollectionsAmt > 0) $insights[] = "Collected AED " . number_format($todayCollectionsAmt) . " in this period.";
            if ($outstandingAmt > 0) $insights[] = "Outstanding payments reached AED " . number_format($outstandingAmt) . ".";
            
            $pendingDeliveries = (clone $bookingsQuery)->where('delivery_status', false)->whereBetween('delivery_date', [$startDate, $endDate])->count();
            if ($pendingDeliveries > 0) $insights[] = "$pendingDeliveries deliveries are currently pending.";
            if (empty($insights)) $insights[] = "Business is quiet right now. No major activities.";

            return [
                'today_bookings'       => (clone $bookingsQuery)->whereBetween('booking_date', [$startDate, $endDate])->count(),
                'today_booking_amount' => $todayBookingsAmt,
                'today_payments'       => $todayCollectionsAmt,
                'today_cash_payments'  => (clone $paymentsQuery)->whereBetween('payment_date', [$startDate, $endDate])->where('payment_method_id', 1)->sum('amount'),
                'today_card_payments'  => (clone $paymentsQuery)->whereBetween('payment_date', [$startDate, $endDate])->where('payment_method_id', '!=', 1)->sum('amount'),
                'today_expenses'       => (clone $expensesQuery)->whereBetween('expense_date', [$startDate, $endDate])->sum('amount'),
                'today_deliveries'     => (clone $bookingsQuery)->where('delivery_status', true)->whereBetween('delivered_at', [$startDate, $endDate])->count(),
                'today_outstanding'    => $outstandingAmt,

                'cash_balance' => (clone $ledgerQuery)
                    ->where('payment_method_id', 1)
                    ->sum(\Illuminate\Support\Facades\DB::raw('credit - debit')),
                'bank_balance' => (clone $ledgerQuery)
                    ->where('payment_method_id', 2)
                    ->sum(\Illuminate\Support\Facades\DB::raw('credit - debit')),

                'unread_notifications' => Notification::forCurrentUser()->active()->where('is_read', false)->count(),
                'active_users'         => User::where('is_active', true)->count(),

                // New analytical datasets
                'outstanding_customers'  => $outstandingCustomers,
                'latest_activities'      => $activities,
                'chart_collections'      => $chartCollections,
                'chart_expenses'         => $chartExpenses,
                'chart_monthly_bookings' => $chartMonthly,
                'insights'               => $insights,

                // Return the active range so frontend knows what was applied
                'period_start' => $startDate,
                'period_end'   => $endDate,
            ];
        });
    }
}
