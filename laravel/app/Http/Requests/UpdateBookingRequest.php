<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bookingId = $this->route('booking') ? $this->route('booking')->id : null;

        return [
            'shop_id' => ['required', 'exists:shops,id'],
            'bill_no' => [
                'required',
                'string',
                'max:30',
                \Illuminate\Validation\Rule::unique('bookings')->ignore($bookingId)->where('shop_id', $this->shop_id),
            ],
            'booking_date' => ['required', 'date'],
            'delivery_date' => ['required', 'date', 'after_or_equal:booking_date'],
            'customer_name' => ['required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:10'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'pcs' => ['required', 'integer', 'min:1'],
            'booking_amount' => ['required', 'numeric', 'min:0'],
            'advance_amount' => ['nullable', 'numeric', 'min:0'],
            'advance_payment_method_id' => [
                'nullable',
                'required_if:advance_amount,>,0',
                'exists:payment_methods,id'
            ],
            'status' => ['required', 'integer', 'in:0,1,2,3,4'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
