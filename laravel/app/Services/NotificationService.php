<?php

namespace App\Services;

use App\Services\Notifications\Channels\DatabaseChannel;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Dispatch a notification to all configured channels.
     */
    public static function send(
        string $title,
        string $message,
        string $category,
        string $type,
        string $priority = 'Normal',
        ?string $icon = null,
        ?int $shopId = null,
        ?int $userId = null,
        ?Model $reference = null,
        ?string $actionUrl = null,
        ?Carbon $expiresAt = null
    ): void {
        $payload = [
            'title'          => $title,
            'message'        => $message,
            'category'       => $category,
            'type'           => $type,
            'priority'       => $priority,
            'icon'           => $icon,
            'shop_id'        => $shopId,
            'user_id'        => $userId,
            'reference_type' => $reference ? get_class($reference) : null,
            'reference_id'   => $reference ? $reference->id : null,
            'action_url'     => $actionUrl,
            'expires_at'     => $expiresAt,
        ];

        // Route to Channels
        // Future: EmailChannel, SMSChannel, WebSocketChannel, Queue
        
        // Route to Jobs instead of blocking request
        \App\Jobs\ProcessNotificationJob::dispatch($payload);
    }
}
