<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Traits\MasterCrudTrait;

class ShopController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = Shop::class;

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ];
    }
}
