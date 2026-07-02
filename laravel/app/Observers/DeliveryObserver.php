<?php

namespace App\Observers;

use App\Models\Delivery;
use Illuminate\Support\Facades\Auth;

class DeliveryObserver
{
    /**
     * Handle the Delivery "creating" event.
     */
    public function creating(Delivery $delivery): void
    {
        if (Auth::check()) {
            $delivery->created_by = Auth::id();
        } else {
            $delivery->created_by = $delivery->created_by ?? 1;
        }
    }

    /**
     * Handle the Delivery "updating" event.
     */
    public function updating(Delivery $delivery): void
    {
        if (Auth::check()) {
            $delivery->updated_by = Auth::id();
        } else {
            $delivery->updated_by = $delivery->updated_by ?? 1;
        }
    }

    /**
     * Handle the Delivery "created" event.
     */
    public function created(Delivery $delivery): void
    {
        $delivery->booking->recalculateStatus();

        $delivery->loadMissing('booking');
        \App\Services\NotificationService::send(
            title: "Delivery Completed",
            message: "Delivery scheduled/completed for Booking #" . ($delivery->booking->bill_no ?? ''),
            category: "DELIVERY",
            type: "Delivery Completed",
            priority: "Normal",
            icon: "delivery",
            shopId: $delivery->shop_id,
            reference: $delivery
        );
    }

    /**
     * Handle the Delivery "deleted" event.
     */
    public function deleted(Delivery $delivery): void
    {
        $delivery->booking->recalculateStatus();
    }
}
