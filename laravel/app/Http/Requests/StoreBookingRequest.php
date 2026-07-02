<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'exists:shops,id'],
            'bill_no' => [
                'required',
                'string',
                'max:30',
                \Illuminate\Validation\Rule::unique('bookings')->where('shop_id', $this->shop_id),
            ],
            'booking_date' => ['required', 'date'],
            'delivery_date' => ['required', 'date', 'after_or_equal:booking_date'],
            'customer_name' => ['required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:10'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'pcs' => ['required', 'integer', 'min:1'],
            'booking_amount' => ['required', 'numeric', 'min:0'],
            'advance_amount' => ['required', 'numeric', 'min:0', 'lte:booking_amount'],
            'advance_payment_method_id' => [
                \Illuminate\Validation\Rule::requiredIf(fn () => (float)$this->advance_amount > 0),
                'nullable',
                'exists:payment_methods,id'
            ],
            'remarks' => ['nullable', 'string'],
        ];
    }
}