<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExpenseMaster;
use App\Traits\MasterCrudTrait;

class ExpenseMasterController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = ExpenseMaster::class;
    protected $withRelations = ['expenseCategory.department'];

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'expense_category_id' => 'required|exists:expense_categories,id',
            'is_active' => 'boolean',
        ];
    }
}
