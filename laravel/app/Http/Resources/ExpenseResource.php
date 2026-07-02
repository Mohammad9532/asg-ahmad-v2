<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
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
            'department_id' => $this->department_id,
            'expense_category_id' => $this->expense_category_id,
            'expense_master_id' => $this->expense_master_id,
            'employee_id' => $this->employee_id,
            'payment_method_id' => $this->payment_method_id,
            'expense_date' => $this->expense_date ? $this->expense_date->format('Y-m-d') : null,
            'amount' => (float) $this->amount,
            'remarks' => $this->remarks,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updated_at' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
            
            // Relationships
            'shop' => $this->whenLoaded('shop'),
            'department' => $this->whenLoaded('department'),
            'expense_category' => $this->whenLoaded('expenseCategory'),
            'expense_master' => $this->whenLoaded('expenseMaster'),
            'employee' => $this->whenLoaded('employee'),
            'payment_method' => $this->whenLoaded('paymentMethod'),
            'creator' => $this->whenLoaded('creator'),
            'updater' => $this->whenLoaded('updater'),
        ];
    }
}
