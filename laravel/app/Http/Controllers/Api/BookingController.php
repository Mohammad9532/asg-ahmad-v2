<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BookingController extends Controller
{
    /**
     * Display a listing of the bookings.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Booking::forCurrentUser()->with(['shop', 'advancePaymentMethod']);

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        // Filter by shop
        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->input('shop_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('booking_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        } elseif ($request->filled('start_date')) {
            $query->where('booking_date', '>=', $request->input('start_date'));
        } elseif ($request->filled('end_date')) {
            $query->where('booking_date', '<=', $request->input('end_date'));
        }

        // Pending Delivery Filter
        if ($request->boolean('pending_delivery')) {
            $query->whereIn('status', [Booking::STATUS_STOCK, Booking::STATUS_PARTIALLY_PAID, Booking::STATUS_FULLY_PAID]);
            $query->orderBy('delivery_date', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->input('per_page', 15);
        $bookings = $query->paginate($perPage);

        return BookingResource::collection($bookings);
    }

    public function nextNumber(Request $request): \Illuminate\Http\JsonResponse
    {
        $latest = Booking::where('shop_id', $request->user()->shop_id ?? 1)
            ->orderBy('id', 'desc')
            ->first();
        
        if ($latest && preg_match('/^(.*?)(\d+)$/', $latest->bill_no, $match)) {
            $prefix = $match[1];
            $numberStr = $match[2];
            $nextNumber = (int)$numberStr + 1;
            
            // Preserve the original padding length
            $nextBillNo = $prefix . str_pad((string)$nextNumber, strlen($numberStr), '0', STR_PAD_LEFT);
            
            return response()->json([
                'next_bill_no' => $nextBillNo
            ]);
        }
        
        // Fallback if no bookings exist or format is completely unrecognized
        $defaultPrefix = setting('booking_prefix', 'BOK-');
        if (!str_ends_with($defaultPrefix, '-')) {
            $defaultPrefix .= '-';
        }
        
        return response()->json([
            'next_bill_no' => sprintf('%s%06d', $defaultPrefix, 1)
        ]);
    }

    /**
     * Store a newly created booking in storage.
     */
    public function store(StoreBookingRequest $request): BookingResource
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            $data['status'] = Booking::STATUS_STOCK;

            if ((float)$data['advance_amount'] === 0.0) {
                $data['advance_payment_method_id'] = null;
            }

            $booking = Booking::create($data);
            $booking->load(['shop', 'advancePaymentMethod']);

            return new BookingResource($booking);
        });
    }

    /**
     * Display the specified booking.
     */
    public function show(Booking $booking): BookingResource
    {
        Gate::authorize('view', $booking);
        
        $booking->load(['shop', 'advancePaymentMethod']);
        return new BookingResource($booking);
    }

    /**
     * Update the specified booking in storage.
     */
    public function update(UpdateBookingRequest $request, Booking $booking): BookingResource
    {
        Gate::authorize('update', $booking);

        return DB::transaction(function () use ($request, $booking) {
            $booking->update($request->validated());
            $booking->load(['shop', 'advancePaymentMethod']);

            return new BookingResource($booking);
        });
    }

    /**
     * Remove the specified booking from storage.
     */
    public function destroy(Booking $booking): Response
    {
        Gate::authorize('delete', $booking);

        return DB::transaction(function () use ($booking) {
            $booking->delete();
            return response()->noContent();
        });
    }
}