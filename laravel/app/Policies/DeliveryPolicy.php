<?php

namespace App\Policies;

use App\Models\Delivery;
use App\Models\User;

class DeliveryPolicy
{
    public function view(User $user, Delivery $delivery): bool
    {
        return $user->isGlobal() || $user->shop_id === $delivery->booking->shop_id;
    }

    public function update(User $user, Delivery $delivery): bool
    {
        return $user->isGlobal() || $user->shop_id === $delivery->booking->shop_id;
    }

    public function delete(User $user, Delivery $delivery): bool
    {
        return $user->isGlobal() || $user->shop_id === $delivery->booking->shop_id;
    }
}
