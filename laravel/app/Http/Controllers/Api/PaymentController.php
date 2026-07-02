<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    /**
     * Display a listing of the payments.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Payment::forCurrentUser()->with(['booking', 'paymentMethod', 'creator', 'updater']);

        // Search through related Booking
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('booking', function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Filter by booking_id
        if ($request->filled('booking_id')) {
            $query->where('booking_id', $request->input('booking_id'));
        }

        // Filter by payment method
        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->input('payment_method_id'));
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('payment_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        } elseif ($request->filled('start_date')) {
            $query->where('payment_date', '>=', $request->input('start_date'));
        } elseif ($request->filled('end_date')) {
            $query->where('payment_date', '<=', $request->input('end_date'));
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 15);
        $payments = $query->paginate($perPage);

        return PaymentResource::collection($payments);
    }

    /**
     * Store a newly created payment in storage.
     */
    public function store(StorePaymentRequest $request): PaymentResource
    {
        return DB::transaction(function () use ($request) {
            // Lock the booking to prevent race conditions when checking balance
            $booking = Booking::where('id', $request->booking_id)
                   ->lockForUpdate()
                   ->firstOrFail();

            $payment = Payment::create($request->validated());
            
            // Re-fetch booking to get updated balance (calculated by observer/model event)
            $booking->refresh();
            
            if ($booking->remaining_balance <= 0 && !$booking->delivery_status) {
                $booking->status = 3;
                $booking->delivery_status = true;
                $booking->delivered_at = now();
                $booking->delivered_by = auth()->id();
                $booking->save();
            }

            $payment->load(['booking', 'paymentMethod', 'creator', 'updater']);

            return new PaymentResource($payment);
        });
    }

    /**
     * Display the specified payment.
     */
    public function show(Payment $payment): PaymentResource
    {
        Gate::authorize('view', $payment);
        $payment->load(['booking', 'paymentMethod', 'creator', 'updater']);
        return new PaymentResource($payment);
    }

    /**
     * Update the specified payment in storage.
     */
    public function update(UpdatePaymentRequest $request, Payment $payment): PaymentResource
    {
        Gate::authorize('update', $payment);

        return DB::transaction(function () use ($request, $payment) {
            Booking::where('id', $payment->booking_id)
                   ->lockForUpdate()
                   ->firstOrFail();

            $payment->update($request->validated());

            $payment->load(['booking', 'paymentMethod', 'creator', 'updater']);

            return new PaymentResource($payment);
        });
    }

    /**
     * Remove the specified payment from storage.
     */
    public function destroy(Payment $payment): Response
    {
        Gate::authorize('delete', $payment);

        return DB::transaction(function () use ($payment) {
            // Lock the booking
            Booking::where('id', $payment->booking_id)
                   ->lockForUpdate()
                   ->firstOrFail();
                   
            // Note: Ledger integration will prevent deletion here later
            
            $payment->delete();
            
            return response()->noContent();
        });
    }
}
