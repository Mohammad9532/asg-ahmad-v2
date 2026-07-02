<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        // Payment belongs to Booking, so check Booking's shop
        return $user->isGlobal() || $user->shop_id === $payment->booking->shop_id;
    }

    public function update(User $user, Payment $payment): bool
    {
        return $user->isGlobal() || $user->shop_id === $payment->booking->shop_id;
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->isGlobal() || $user->shop_id === $payment->booking->shop_id;
    }
}
