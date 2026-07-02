<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
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
            'shop_id' => $this->shop_id,
            'bill_no' => $this->bill_no,
            'booking_date' => $this->booking_date ? $this->booking_date->format('Y-m-d') : null,
            'delivery_date' => $this->delivery_date ? $this->delivery_date->format('Y-m-d') : null,
            'customer_name' => $this->customer_name,
            'country_code' => $this->country_code,
            'mobile' => $this->mobile,
            'pcs' => $this->pcs,
            'booking_amount' => (float) $this->booking_amount,
            'advance_amount' => (float) $this->advance_amount,
            'advance_payment_method_id' => $this->advance_payment_method_id,
            'total_paid' => $this->total_paid,
            'remaining_balance' => $this->remaining_balance,
            'status' => (int) $this->status,
            'remarks' => $this->remarks,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            
            // Relationships
            'shop' => $this->whenLoaded('shop'),
            'advance_payment_method' => $this->whenLoaded('advancePaymentMethod'),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'creator' => $this->whenLoaded('creator'),
            'updater' => $this->whenLoaded('updater'),
        ];
    }
}
