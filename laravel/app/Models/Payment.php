<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\PaymentObserver;
use App\Models\Traits\HasShopAccessScope;

#[ObservedBy(PaymentObserver::class)]
class Payment extends Model
{
    use HasShopAccessScope;
    protected $fillable = [
        'booking_id',
        'payment_method_id',
        'payment_date',
        'amount',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope a query to only include records accessible by the current user.
     * Overrides HasShopAccessScope since payments don't have a shop_id column.
     */
    public function scopeForCurrentUser(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        if (!\Illuminate\Support\Facades\Auth::check()) {
            return $query;
        }

        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user->isGlobal()) {
            return $query;
        }

        return $query->whereHas('booking', function ($q) use ($user) {
            $q->where('shop_id', $user->shop_id);
        });
    }
}
