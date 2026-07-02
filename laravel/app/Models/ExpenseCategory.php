<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends Model
{
    protected $fillable = [
        'department_id',
        'name',
        'is_active',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function expenseMasters(): HasMany
    {
        return $this->hasMany(ExpenseMaster::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}