<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    /**
     * Retrieve a setting by its key.
     * Uses a single cached query for O(1) retrieval across the app.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $settings = Cache::rememberForever('app_settings', function () {
            return Setting::all()->keyBy('key');
        });

        if ($settings->has($key)) {
            return $settings->get($key)->parsed_value;
        }

        return $default;
    }

    /**
     * Set a setting's value dynamically.
     */
    public function set(string $key, mixed $value): void
    {
        $setting = Setting::where('key', $key)->first();
        if ($setting) {
            $setting->update(['value' => $value]);
        }
    }
}
