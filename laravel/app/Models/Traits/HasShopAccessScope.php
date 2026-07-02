<?php

namespace App\Models\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait HasShopAccessScope
{
    /**
     * Scope a query to only include records accessible by the current user.
     */
    public function scopeForCurrentUser(Builder $query): Builder
    {
        if (!Auth::check()) {
            return $query;
        }

        $user = Auth::user();

        // If user is global, they can see everything
        if ($user->isGlobal()) {
            return $query;
        }

        // Otherwise, scope to their specific shop
        return $query->where('shop_id', $user->shop_id);
    }
}
