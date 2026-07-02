<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class BackupHistory extends Model
{
    protected $fillable = [
        'filename',
        'size_bytes',
        'status',
        'execution_time_ms',
        'error_message',
        'restore_token',
        'restore_token_expires_at',
        'created_by',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'execution_time_ms' => 'integer',
        'restore_token_expires_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check() && !$model->created_by) {
                $model->created_by = Auth::id();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
