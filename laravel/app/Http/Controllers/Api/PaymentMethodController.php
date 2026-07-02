<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Traits\MasterCrudTrait;

class PaymentMethodController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = PaymentMethod::class;

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
