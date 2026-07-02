<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\BookingObserver;
use App\Models\Traits\HasShopAccessScope;

#[ObservedBy(BookingObserver::class)]
class Booking extends Model
{
    use HasShopAccessScope;

    public const STATUS_STOCK = 0;
    public const STATUS_PARTIALLY_PAID = 1;
    public const STATUS_FULLY_PAID = 2;
    public const STATUS_DELIVERED = 3;
    public const STATUS_CANCELLED = 4;

    protected $fillable = [
        'shop_id',
        'bill_no',
        'booking_date',
        'delivery_date',
        'customer_name',
        'country_code',
        'mobile',
        'pcs',
        'booking_amount',
        'advance_amount',
        'advance_payment_method_id',
        'total_paid',
        'remaining_balance',
        'status',
        'delivery_status',
        'delivered_at',
        'delivered_by',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'delivery_date' => 'date',
        'booking_amount' => 'decimal:2',
        'advance_amount' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'status' => 'integer',
        'delivery_status' => 'boolean',
        'delivered_at' => 'datetime',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function advancePaymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'advance_payment_method_id');
    }

    public function deliveredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }

    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function recalculateStatus(): void
    {
        // Compute and cache financial totals
        $paid = (float) $this->payments()->sum('amount');
        $balance = (float) ($this->booking_amount - $paid);
        
        $this->total_paid = $paid;
        $this->remaining_balance = $balance;

        // 0=Stock, 1=Partially Paid, 2=Fully Paid, 3=Delivered, 4=Cancelled

        // If cancelled, keep it cancelled but save the financials
        if ($this->status === self::STATUS_CANCELLED) {
            $this->save();
            return;
        }

        // If delivered, force status to 3
        if ($this->delivery_status) {
            $this->status = self::STATUS_DELIVERED;
            $this->save();
            return;
        }

        if ($paid == 0) {
            $this->status = self::STATUS_STOCK;
        } elseif ($paid > 0 && $balance > 0) {
            $this->status = self::STATUS_PARTIALLY_PAID;
        } elseif ($balance <= 0) {
            $this->status = self::STATUS_FULLY_PAID;
        }

        $this->save();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}