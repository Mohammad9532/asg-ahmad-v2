<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => $this->parsed_value, // Use the accessor so it's already cast/decrypted
            'type' => $this->type,
            'group' => $this->group,
            'description' => $this->description,
            'is_public' => $this->is_public,
            'version' => $this->version,
            'created_by' => clone $this->whenLoaded('creator'),
            'updated_by' => clone $this->whenLoaded('updater'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
