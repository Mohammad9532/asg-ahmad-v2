<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Traits\MasterCrudTrait;

class DepartmentController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = Department::class;

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ];
    }
}
