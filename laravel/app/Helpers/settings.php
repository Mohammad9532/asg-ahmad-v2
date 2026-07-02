<?php

if (!function_exists('setting')) {
    /**
     * Global helper to retrieve settings using the SettingsService.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function setting(string $key, mixed $default = null): mixed
    {
        return app(\App\Services\SettingsService::class)->get($key, $default);
    }
}
