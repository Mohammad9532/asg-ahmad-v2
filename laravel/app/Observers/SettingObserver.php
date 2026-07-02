<?php

namespace App\Observers;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;

class SettingObserver
{
    public function creating(Setting $setting): void
    {
        if (Auth::check()) {
            $setting->created_by = Auth::id();
        }

        // Handle encryption before saving
        if ($setting->type === 'encrypted' && !empty($setting->value)) {
            // Note: If seeded with Crypt::encryptString, we shouldn't encrypt it again if it's already encrypted.
            // A simple check is if it starts with 'eyJ' (base64 of {"iv").
            if (!str_starts_with($setting->value, 'eyJ')) {
                $setting->value = Crypt::encryptString($setting->value);
            }
        }
    }

    public function updating(Setting $setting): void
    {
        if (Auth::check()) {
            $setting->updated_by = Auth::id();
        }

        if ($setting->isDirty('value') || $setting->isDirty('type') || $setting->isDirty('is_public') || $setting->isDirty('group')) {
            $setting->version = $setting->getOriginal('version', 1) + 1;
        }

        // Handle encryption on update if value changed
        if ($setting->type === 'encrypted' && $setting->isDirty('value') && !empty($setting->value)) {
            if (!str_starts_with($setting->value, 'eyJ')) {
                $setting->value = Crypt::encryptString($setting->value);
            }
        }
    }

    public function saved(Setting $setting): void
    {
        Cache::forget('app_settings');
        
        if ($setting->wasRecentlyCreated) {
            ActivityLogService::log('Created Setting', 'Settings', $setting);
        } else {
            ActivityLogService::log('Updated Setting', 'Settings', $setting);
        }

        \App\Services\NotificationService::send(
            title: "Settings Updated",
            message: "System setting '{$setting->key}' has been updated.",
            category: "SETTINGS",
            type: "Settings Updated",
            priority: "Low",
            icon: "settings",
            reference: $setting
        );
    }

    public function deleted(Setting $setting): void
    {
        Cache::forget('app_settings');
        ActivityLogService::log('Deleted Setting', 'Settings', $setting);
    }
}
