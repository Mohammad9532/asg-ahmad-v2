<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'booking_id' => $this->booking_id,
            'payment_method_id' => $this->payment_method_id,
            'payment_date' => $this->payment_date ? $this->payment_date->format('Y-m-d') : null,
            'amount' => (float) $this->amount,
            'remarks' => $this->remarks,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            
            // Relationships
            'booking' => $this->whenLoaded('booking', function () {
                return new BookingResource($this->booking);
            }),
            'payment_method' => $this->whenLoaded('paymentMethod'),
            'creator' => $this->whenLoaded('creator'),
            'updater' => $this->whenLoaded('updater'),
        ];
    }
}
