<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class Notification extends Model
{
    protected $fillable = [
        'shop_id',
        'user_id',
        'title',
        'message',
        'category',
        'type',
        'priority',
        'icon',
        'action_url',
        'reference_type',
        'reference_id',
        'is_read',
        'read_at',
        'is_archived',
        'expires_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'is_archived' => 'boolean',
        'expires_at' => 'datetime',
    ];

    /**
     * Scope a query to only include active notifications (not archived, not expired).
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope a query to only include notifications accessible by the current user.
     */
    public function scopeForCurrentUser(Builder $query): Builder
    {
        if (!Auth::check()) {
            return $query; // handled by auth middleware anyway
        }

        $user = Auth::user();

        if ($user->isGlobal()) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->where('shop_id', $user->shop_id)
              ->orWhere('user_id', $user->id);
        });
    }

    public function shop(): BelongsTo
    {
        return $this->belongsTo(Shop::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
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
