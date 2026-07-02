<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLedgerEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', 'in:CREDIT,DEBIT'],
            'source' => ['required', 'string', 'in:Opening Balance,Adjustment'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'entry_date' => ['required', 'date'],
            'shop_id' => ['required', 'exists:shops,id'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'remarks' => ['required', 'string'],
        ];
    }
}
