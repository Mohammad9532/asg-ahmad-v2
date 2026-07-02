<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'category' => $this->category,
            'type' => $this->type,
            'priority' => $this->priority,
            'icon' => $this->icon,
            'action_url' => $this->action_url,
            'reference_type' => class_basename($this->reference_type),
            'reference_id' => $this->reference_id,
            'is_read' => $this->is_read,
            'read_at' => $this->read_at,
            'is_archived' => $this->is_archived,
            'expires_at' => $this->expires_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
