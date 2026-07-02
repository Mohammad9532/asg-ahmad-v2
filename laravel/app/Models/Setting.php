<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use App\Observers\SettingObserver;

#[ObservedBy(SettingObserver::class)]
class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
        'is_public',
        'version',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'version' => 'integer',
    ];

    /**
     * Get the dynamically typed/parsed value.
     */
    protected function parsedValue(): Attribute
    {
        return Attribute::make(
            get: function () {
                $value = $this->attributes['value'] ?? null;
                if ($value === null) return null;

                return match ($this->type) {
                    'integer' => (int) $value,
                    'decimal' => (float) $value,
                    'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
                    'json' => json_decode($value, true),
                    'encrypted' => Crypt::decryptString($value),
                    default => $value, // string, text, file
                };
            },
        );
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
