<?php

namespace App\Services\Notifications\Channels;

use App\Models\Notification;

class DatabaseChannel
{
    /**
     * Send the given notification to the database.
     */
    public function send(array $data): void
    {
        Notification::create([
            'shop_id'        => $data['shop_id'] ?? null,
            'user_id'        => $data['user_id'] ?? null,
            'title'          => $data['title'],
            'message'        => $data['message'],
            'category'       => $data['category'],
            'type'           => $data['type'],
            'priority'       => $data['priority'] ?? 'Normal',
            'icon'           => $data['icon'] ?? null,
            'action_url'     => $data['action_url'] ?? null,
            'reference_type' => $data['reference_type'] ?? null,
            'reference_id'   => $data['reference_id'] ?? null,
            'expires_at'     => $data['expires_at'] ?? null,
        ]);
    }
}
