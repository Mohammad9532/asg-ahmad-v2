<?php

namespace App\Services;

use App\Models\Ledger;
use App\Models\Payment;
use App\Models\Expense;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class LedgerService
{
    /**
     * Generate the next transaction number: LEDYYYY000001
     */
    private function generateTransactionNumber(): string
    {
        $year = date('Y');
        $prefix = "LED{$year}";

        return DB::transaction(function () use ($prefix) {
            $lastLedger = Ledger::where('transaction_no', 'like', "{$prefix}%")
                ->orderBy('id', 'desc')
                ->lockForUpdate()
                ->first();

            if (!$lastLedger) {
                return $prefix . '000001';
            }

            $lastSequence = (int) substr($lastLedger->transaction_no, 7);
            $nextSequence = str_pad($lastSequence + 1, 6, '0', STR_PAD_LEFT);

            return $prefix . $nextSequence;
        });
    }

    /**
     * Record a mapped transaction in the Ledger.
     */
    public function record(array $ledgerData): Ledger
    {
        $ledgerData['transaction_no'] = $this->generateTransactionNumber();
        
        return Ledger::create($ledgerData);
    }
}
