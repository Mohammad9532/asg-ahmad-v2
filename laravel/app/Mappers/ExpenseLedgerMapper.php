<?php

namespace App\Mappers;

use App\Models\Expense;
use Illuminate\Support\Facades\Auth;

class ExpenseLedgerMapper
{
    /**
     * Map an Expense model into a Ledger data array.
     */
    public static function map(Expense $expense): array
    {
        return [
            'shop_id' => $expense->shop_id,
            'entry_date' => $expense->expense_date,
            'transaction_type' => 'DEBIT',
            'source' => 'EXPENSE',
            'reference_type' => Expense::class,
            'reference_id' => $expense->id,
            'payment_method_id' => $expense->payment_method_id,
            'debit' => $expense->amount,
            'credit' => 0,
            'remarks' => $expense->remarks,
            'created_by' => Auth::id() ?? 1,
            'updated_by' => Auth::id() ?? 1,
        ];
    }
}
