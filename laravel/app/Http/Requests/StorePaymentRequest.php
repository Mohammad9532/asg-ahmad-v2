<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $booking = Booking::find($this->booking_id);
        $maxAllowed = $booking ? $booking->remaining_balance : 0;

        return [
            'booking_id' => ['required', 'exists:bookings,id'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0', 'max:' . $maxAllowed],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.max' => 'The payment amount cannot exceed the remaining balance of the booking.',
        ];
    }
}
