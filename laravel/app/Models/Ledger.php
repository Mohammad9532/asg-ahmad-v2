<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Traits\HasShopAccessScope;

class Ledger extends Model
{
    use HasShopAccessScope;
    protected $fillable = [
        'transaction_no',
        'shop_id',
        'entry_date',
        'transaction_type',
        'source',
        'reference_type',
        'reference_id',
        'payment_method_id',
        'debit',
        'credit',
        'is_reversed',
        'reversal_of',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'is_reversed' => 'boolean',
    ];

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'payment_method_id');
    }

    /**
     * Get the parent reference model (Payment, Expense, etc.)
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the original ledger entry that this entry reverses.
     */
    public function reversedOriginal(): BelongsTo
    {
        return $this->belongsTo(Ledger::class, 'reversal_of');
    }

    /**
     * Get the ledger entry that reversed this one.
     */
    public function reversedBy(): HasOne
    {
        return $this->hasOne(Ledger::class, 'reversal_of');
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
