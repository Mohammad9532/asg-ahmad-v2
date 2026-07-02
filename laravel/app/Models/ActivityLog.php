<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

use App\Models\Traits\HasShopAccessScope;

class ActivityLog extends Model
{
    use HasShopAccessScope;

    protected $fillable = [
        'user_id',
        'shop_id',
        'action',
        'module',
        'reference_type',
        'reference_id',
        'ip',
        'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
