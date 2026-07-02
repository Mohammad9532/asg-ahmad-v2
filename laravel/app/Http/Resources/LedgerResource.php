<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LedgerResource extends JsonResource
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
            'transaction_no' => $this->transaction_no,
            'shop_id' => $this->shop_id,
            'entry_date' => $this->entry_date ? $this->entry_date->format('Y-m-d') : null,
            'transaction_type' => $this->transaction_type,
            'source' => $this->source,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'payment_method_id' => $this->payment_method_id,
            'debit' => (float) $this->debit,
            'credit' => (float) $this->credit,
            'is_reversed' => (bool) $this->is_reversed,
            'reversal_of' => $this->reversal_of,
            'remarks' => $this->remarks,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            
            // Relationships
            'shop' => $this->whenLoaded('shop'),
            'payment_method' => $this->whenLoaded('paymentMethod'),
            'reference' => $this->whenLoaded('reference'),
            'reversed_original' => $this->whenLoaded('reversedOriginal'),
            'reversed_by' => $this->whenLoaded('reversedBy'),
            'creator' => $this->whenLoaded('creator'),
            'updater' => $this->whenLoaded('updater'),
        ];
    }
}
