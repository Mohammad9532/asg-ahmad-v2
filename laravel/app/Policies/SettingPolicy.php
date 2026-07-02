<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Setting $setting): bool
    {
        if ($user->hasRole(['Super Admin', 'Owner'])) {
            return true;
        }

        return $setting->is_public === true;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['Super Admin', 'Owner']);
    }

    public function update(User $user, Setting $setting): bool
    {
        return $user->hasRole(['Super Admin', 'Owner']);
    }

    public function delete(User $user, Setting $setting): bool
    {
        return $user->hasRole(['Super Admin', 'Owner']);
    }
}
