<?php

namespace App\Observers;

use App\Models\Expense;
use Illuminate\Support\Facades\Auth;
use App\Services\LedgerService;
use App\Mappers\ExpenseLedgerMapper;
use Illuminate\Validation\ValidationException;

class ExpenseObserver
{
    /**
     * Handle the Expense "creating" event.
     */
    public function creating(Expense $expense): void
    {
        if (Auth::check()) {
            $expense->created_by = Auth::id();
        } else {
            // Fallback for local testing if not authenticated via Sanctum
            $expense->created_by = $expense->created_by ?? 1;
        }
    }

    /**
     * Handle the Expense "updating" event.
     */
    public function updating(Expense $expense): void
    {
        throw ValidationException::withMessages([
            'general' => 'Expenses cannot be updated once recorded to preserve ledger integrity. Please create a reversing transaction instead.'
        ]);
    }

    /**
     * Handle the Expense "created" event.
     */
    public function created(Expense $expense): void
    {
        // Record to Ledger
        $ledgerService = new LedgerService();
        $ledgerService->record(ExpenseLedgerMapper::map($expense));

        \App\Services\NotificationService::send(
            title: "Expense Created",
            message: "An expense of " . number_format($expense->amount, 2) . " has been recorded.",
            category: "EXPENSE",
            type: "Expense Created",
            priority: "Normal",
            icon: "expense",
            shopId: $expense->shop_id,
            reference: $expense
        );
    }

    /**
     * Handle the Expense "deleting" event.
     */
    public function deleting(Expense $expense): void
    {
        throw ValidationException::withMessages([
            'general' => 'Expenses cannot be deleted once recorded to preserve ledger integrity. Please create a reversing transaction instead.'
        ]);
    }
}
