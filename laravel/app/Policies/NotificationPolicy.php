<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;

class NotificationPolicy
{
    public function view(User $user, Notification $notification): bool
    {
        if ($user->isGlobal()) {
            return true;
        }

        return $notification->shop_id === $user->shop_id || $notification->user_id === $user->id;
    }

    public function markAsRead(User $user, Notification $notification): bool
    {
        return $this->view($user, $notification);
    }

    public function archive(User $user, Notification $notification): bool
    {
        return $this->view($user, $notification);
    }
}
