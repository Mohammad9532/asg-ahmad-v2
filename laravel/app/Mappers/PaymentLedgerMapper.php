<?php

namespace App\Mappers;

use App\Models\Payment;
use Illuminate\Support\Facades\Auth;

class PaymentLedgerMapper
{
    /**
     * Map a Payment model into a Ledger data array.
     */
    public static function map(Payment $payment): array
    {
        return [
            'shop_id' => $payment->booking->shop_id,
            'entry_date' => $payment->payment_date,
            'transaction_type' => 'CREDIT',
            'source' => 'PAYMENT',
            'reference_type' => Payment::class,
            'reference_id' => $payment->id,
            'payment_method_id' => $payment->payment_method_id,
            'debit' => 0,
            'credit' => $payment->amount,
            'remarks' => $payment->remarks ?? 'Payment received for booking ' . $payment->booking->bill_no,
            'created_by' => Auth::id() ?? 1,
            'updated_by' => Auth::id() ?? 1,
        ];
    }
}
