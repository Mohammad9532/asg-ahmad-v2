<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use App\Traits\MasterCrudTrait;

class ExpenseCategoryController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = ExpenseCategory::class;
    protected $withRelations = ['department'];

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'department_id' => 'required|exists:departments,id',
            'is_active' => 'boolean',
        ];
    }
}
