<?php

namespace App\Observers;

use App\Models\Payment;
use Illuminate\Support\Facades\Auth;
use App\Services\LedgerService;
use App\Mappers\PaymentLedgerMapper;
use Illuminate\Validation\ValidationException;

class PaymentObserver
{
    /**
     * Handle the Payment "creating" event.
     */
    public function creating(Payment $payment): void
    {
        if (Auth::check()) {
            $payment->created_by = Auth::id();
        } else {
            $payment->created_by = $payment->created_by ?? 1;
        }
    }

    /**
     * Handle the Payment "updating" event.
     */
    public function updating(Payment $payment): void
    {
        throw ValidationException::withMessages([
            'general' => 'Payments cannot be updated once recorded to preserve ledger integrity. Please create a reversing transaction instead.'
        ]);
    }

    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        // Record to Ledger
        $ledgerService = new LedgerService();
        $ledgerService->record(PaymentLedgerMapper::map($payment));

        $payment->booking->recalculateStatus();

        $payment->loadMissing('booking');
        \App\Services\NotificationService::send(
            title: "Payment Received",
            message: "A payment of " . number_format($payment->amount, 2) . " has been received for Booking #" . ($payment->booking->bill_no ?? ''),
            category: "PAYMENT",
            type: "Payment Received",
            priority: "Normal",
            icon: "payment",
            shopId: $payment->booking->shop_id ?? null,
            reference: $payment
        );
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        // Blocked by updating hook
    }

    /**
     * Handle the Payment "deleting" event.
     */
    public function deleting(Payment $payment): void
    {
        throw ValidationException::withMessages([
            'general' => 'Payments cannot be deleted once recorded to preserve ledger integrity. Please create a reversing transaction instead.'
        ]);
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        // Blocked by deleting hook
    }
}
