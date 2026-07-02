<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $payment = $this->route('payment');
        $booking = $payment ? $payment->booking : null;
        
        // Add the current payment amount back to the remaining balance to allow self-modification
        $maxAllowed = 0;
        if ($booking && $payment) {
            $maxAllowed = $booking->remaining_balance + $payment->amount;
        }

        return [
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
