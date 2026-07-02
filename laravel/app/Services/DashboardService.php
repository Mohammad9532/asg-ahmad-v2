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

class DashboardService
{
    /**
     * Retrieve the materialized dashboard summary.
     * Cached for 60 seconds per user scope.
     */
    public function getSummary(ReportFilterDTO $dto): array
    {
        $userId = Auth::id() ?? 0;
        $shopId = $dto->shop_id ?? 'all';
        $cacheKey = "dashboard_summary_{$userId}_{$shopId}";

        return Cache::remember($cacheKey, 60, function () use ($dto) {
            $today = now()->toDateString();
            
            // Build base queries that respect shop scopes automatically via HasShopAccessScope
            $bookingsQuery = Booking::forCurrentUser();
            $paymentsQuery = Payment::forCurrentUser();
            $expensesQuery = Expense::forCurrentUser();
            $ledgerQuery = Ledger::forCurrentUser();
            
            // Apply explicit shop filter if provided
            if ($dto->shop_id) {
                $bookingsQuery->where('shop_id', $dto->shop_id);
                $paymentsQuery->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
                $expensesQuery->where('shop_id', $dto->shop_id);
                $ledgerQuery->where('shop_id', $dto->shop_id);
            }

            return [
                'today_bookings' => (clone $bookingsQuery)->whereDate('booking_date', $today)->count(),
                'today_booking_amount' => (clone $bookingsQuery)->whereDate('booking_date', $today)->sum('booking_amount'),
                'today_payments' => (clone $paymentsQuery)->whereDate('payment_date', $today)->sum('amount'),
                'today_cash_payments' => (clone $paymentsQuery)->whereDate('payment_date', $today)->where('payment_method_id', 1)->sum('amount'),
                'today_card_payments' => (clone $paymentsQuery)->whereDate('payment_date', $today)->where('payment_method_id', '!=', 1)->sum('amount'),
                'today_expenses' => (clone $expensesQuery)->whereDate('expense_date', $today)->sum('amount'),
                'today_deliveries' => (clone $bookingsQuery)->where('delivery_status', true)->whereDate('delivered_at', $today)->count(),
                'today_outstanding' => (clone $bookingsQuery)->whereDate('booking_date', $today)->sum('remaining_balance'),
                
                // For Cash and Bank balances, we would ideally join with payment methods
                // Assuming payment_method_id 1 is Cash, and 2 is Bank for MVP
                'cash_balance' => (clone $ledgerQuery)
                    ->where('payment_method_id', 1)
                    ->sum(\Illuminate\Support\Facades\DB::raw('credit - debit')),
                    
                'bank_balance' => (clone $ledgerQuery)
                    ->where('payment_method_id', 2)
                    ->sum(\Illuminate\Support\Facades\DB::raw('credit - debit')),
                
                'unread_notifications' => Notification::forCurrentUser()->active()->where('is_read', false)->count(),
                'active_users' => User::where('is_active', true)->count(),
                
                'latest_activities' => ActivityLog::forCurrentUser()
                    ->with('user')
                    ->latest()
                    ->limit(5)
                    ->get(),
            ];
        });
    }
}
