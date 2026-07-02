<?php

namespace App\Observers;

use App\Models\Booking;
use Illuminate\Support\Facades\Auth;

class BookingObserver
{
    /**
     * Handle the Booking "creating" event.
     */
    public function creating(Booking $booking): void
    {
        $booking->total_paid = $booking->total_paid ?? 0;
        $booking->remaining_balance = $booking->booking_amount - $booking->total_paid;

        if (Auth::check()) {
            $booking->created_by = Auth::id();
        } else {
            $booking->created_by = $booking->created_by ?? 1;
        }
    }

    public function created(Booking $booking): void
    {
        \App\Services\NotificationService::send(
            title: "New Booking Created",
            message: "Booking #{$booking->bill_no} has been created for {$booking->customer_name}.",
            category: "BOOKING",
            type: "Booking Created",
            priority: "Normal",
            icon: "booking",
            shopId: $booking->shop_id,
            reference: $booking
        );
    }

    /**
     * Handle the Booking "updating" event.
     */
    public function updating(Booking $booking): void
    {
        if ($booking->isDirty('booking_amount')) {
            $booking->remaining_balance = $booking->booking_amount - ($booking->total_paid ?? 0);
        }

        if (Auth::check()) {
            $booking->updated_by = Auth::id();
        } else {
            $booking->updated_by = $booking->updated_by ?? 1;
        }
    }
}
