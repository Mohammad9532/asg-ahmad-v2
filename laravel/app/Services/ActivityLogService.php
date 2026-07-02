<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Log an action in the system.
     *
     * @param string $action Ex: "Created Booking", "Logged In"
     * @param string $module Ex: "Bookings", "Auth"
     * @param Model|null $reference Optional Eloquent model related to the action
     */
    public static function log(string $action, string $module, ?Model $reference = null): void
    {
        $user = Auth::user();

        ActivityLog::create([
            'user_id' => $user ? $user->id : null,
            'shop_id' => $user ? $user->shop_id : null,
            'action' => $action,
            'module' => $module,
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id' => $reference ? $reference->id : null,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
