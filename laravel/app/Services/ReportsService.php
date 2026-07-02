<?php

namespace App\Services;

use App\DTOs\ReportFilterDTO;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Expense;

use App\Models\Ledger;
use App\Models\ActivityLog;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class ReportsService
{
    private function applyFilters($query, ReportFilterDTO $dto, string $dateColumn)
    {
        if ($dto->shop_id) {
            if ($query->getModel() instanceof Payment) {
                $query->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
            } else {
                $query->where('shop_id', $dto->shop_id);
            }
        }

        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween($dateColumn, [$dto->start_date, $dto->end_date]);
        } elseif ($dto->start_date) {
            $query->where($dateColumn, '>=', $dto->start_date);
        } elseif ($dto->end_date) {
            $query->where($dateColumn, '<=', $dto->end_date);
        }

        return $query;
    }

    private function finalize($query, ReportFilterDTO $dto)
    {
        return $dto->export ? $query->get() : $query->paginate($dto->per_page);
    }

    public function getCashBook(ReportFilterDTO $dto)
    {
        $ledgerQuery = Ledger::forCurrentUser()
            ->with(['paymentMethod', 'creator']);

        if ($dto->shop_id) {
            $ledgerQuery->where('shop_id', $dto->shop_id);
        }
        if ($dto->payment_method) {
            $ledgerQuery->where('payment_method_id', $dto->payment_method);
        }

        // Opening Balance Calculation (Strictly before start_date)
        $openingBalance = 0;
        if ($dto->start_date) {
            $openingQuery = Ledger::forCurrentUser();
            if ($dto->shop_id) $openingQuery->where('shop_id', $dto->shop_id);
            if ($dto->payment_method) $openingQuery->where('payment_method_id', $dto->payment_method);
            
            $openingBalance = $openingQuery->whereDate('entry_date', '<', $dto->start_date)
                ->sum(DB::raw('credit - debit'));
        }

        // Apply date filters to the main query
        $this->applyFilters($ledgerQuery, $dto, 'entry_date');
        $ledgerQuery->orderBy('entry_date', 'asc')->orderBy('id', 'asc');

        if ($dto->export) {
            return [
                'opening_balance' => $openingBalance,
                'data' => $ledgerQuery->get()
            ];
        }

        $paginated = $ledgerQuery->paginate($dto->per_page);
        
        return [
            'opening_balance' => $openingBalance,
            'data' => $paginated
        ];
    }

    public function getLedgerReport(ReportFilterDTO $dto)
    {
        $query = Ledger::forCurrentUser()->with(['shop', 'paymentMethod']);
        $this->applyFilters($query, $dto, 'entry_date');
        
        if ($dto->source) $query->where('source', $dto->source);
        if ($dto->payment_method) $query->where('payment_method_id', $dto->payment_method);

        $query->orderBy('entry_date', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getPaymentReport(ReportFilterDTO $dto)
    {
        $query = Payment::forCurrentUser()->with(['booking', 'paymentMethod']);
        $this->applyFilters($query, $dto, 'payment_date');
        
        if ($dto->payment_method) $query->where('payment_method_id', $dto->payment_method);
        
        $query->orderBy('payment_date', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getExpenseReport(ReportFilterDTO $dto)
    {
        $query = Expense::forCurrentUser()->with(['department', 'expenseCategory', 'expenseMaster', 'employee', 'paymentMethod']);
        $this->applyFilters($query, $dto, 'expense_date');
        
        $query->orderBy('expense_date', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getBookingReport(ReportFilterDTO $dto)
    {
        $query = Booking::forCurrentUser();
        $this->applyFilters($query, $dto, 'booking_date');
        
        $query->orderBy('booking_date', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getOutstandingReport(ReportFilterDTO $dto)
    {
        $query = Booking::forCurrentUser()
            ->where('remaining_balance', '>', 0)
            ->select('*', 
                DB::raw("DATEDIFF(CURRENT_DATE, booking_date) as days_outstanding"),
                DB::raw("CASE 
                    WHEN DATEDIFF(CURRENT_DATE, booking_date) <= 7 THEN '0-7'
                    WHEN DATEDIFF(CURRENT_DATE, booking_date) <= 30 THEN '8-30'
                    WHEN DATEDIFF(CURRENT_DATE, booking_date) <= 60 THEN '31-60'
                    ELSE '60+' 
                END as ageing_bracket")
            );

        if ($dto->shop_id) $query->where('shop_id', $dto->shop_id);

        $query->orderBy('days_outstanding', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getDeliveryReport(ReportFilterDTO $dto)
    {
        $query = Booking::forCurrentUser()->where('delivery_status', true);
        $this->applyFilters($query, $dto, 'delivered_at');
        
        $query->orderBy('delivered_at', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getDailyCollection(ReportFilterDTO $dto)
    {
        $query = Payment::forCurrentUser()
            ->select('payment_date', DB::raw('SUM(amount) as total_collection'), DB::raw('COUNT(id) as total_transactions'))
            ->groupBy('payment_date')
            ->orderBy('payment_date', 'desc');

        if ($dto->shop_id) {
            $query->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
        }

        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween('payment_date', [$dto->start_date, $dto->end_date]);
        }

        return $this->finalize($query, $dto);
    }

    public function getMonthlyCollection(ReportFilterDTO $dto)
    {
        $query = Payment::forCurrentUser()
            ->select(
                DB::raw('DATE_FORMAT(payment_date, "%Y-%m") as month'), 
                DB::raw('SUM(amount) as total_collection')
            )
            ->groupBy('month')
            ->orderBy('month', 'desc');

        if ($dto->shop_id) {
            $query->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
        }

        return $this->finalize($query, $dto);
    }

    public function getShopSummary(ReportFilterDTO $dto)
    {
        // For Shop Summary, we can build a collection summarizing each shop's totals.
        // Due to complexity of joining across modules safely via forCurrentUser(), 
        // we can fetch the shops and map the totals.
        
        $shops = \App\Models\Shop::all();
        $summary = [];

        foreach ($shops as $shop) {
            $summary[] = [
                'shop_id' => $shop->id,
                'shop_name' => $shop->name,
                'bookings_count' => Booking::forCurrentUser()->where('shop_id', $shop->id)->count(),
                'collections' => Payment::forCurrentUser()->whereHas('booking', fn($q) => $q->where('shop_id', $shop->id))->sum('amount'),
                'expenses' => Expense::forCurrentUser()->where('shop_id', $shop->id)->sum('amount'),
                'outstanding' => Booking::forCurrentUser()->where('shop_id', $shop->id)->sum('remaining_balance'),
            ];
        }

        return $summary;
    }

    public function getPaymentMethodSummary(ReportFilterDTO $dto)
    {
        $query = Payment::forCurrentUser()
            ->join('payment_methods', 'payments.payment_method_id', '=', 'payment_methods.id')
            ->select('payment_methods.name', DB::raw('SUM(payments.amount) as total_amount'), DB::raw('COUNT(payments.id) as transaction_count'))
            ->groupBy('payment_methods.name');

        if ($dto->shop_id) {
            $query->whereHas('booking', fn($q) => $q->where('shop_id', $dto->shop_id));
        }
        
        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween('payments.payment_date', [$dto->start_date, $dto->end_date]);
        }

        return $this->finalize($query, $dto);
    }

    public function getActivityLogReport(ReportFilterDTO $dto)
    {
        $query = ActivityLog::forCurrentUser()->with('user');
        
        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween('created_at', [$dto->start_date . ' 00:00:00', $dto->end_date . ' 23:59:59']);
        }
        
        $query->orderBy('created_at', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getNotificationReport(ReportFilterDTO $dto)
    {
        $query = Notification::forCurrentUser();
        
        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween('created_at', [$dto->start_date . ' 00:00:00', $dto->end_date . ' 23:59:59']);
        }
        
        $query->orderBy('created_at', 'desc');
        return $this->finalize($query, $dto);
    }

    public function getUserActivityReport(ReportFilterDTO $dto)
    {
        $query = ActivityLog::forCurrentUser()
            ->where('module', 'Auth')
            ->with('user');
            
        if ($dto->start_date && $dto->end_date) {
            $query->whereBetween('created_at', [$dto->start_date . ' 00:00:00', $dto->end_date . ' 23:59:59']);
        }

        $query->orderBy('created_at', 'desc');
        return $this->finalize($query, $dto);
    }
}
