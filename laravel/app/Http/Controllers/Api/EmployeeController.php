<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Traits\MasterCrudTrait;

class EmployeeController extends Controller
{
    use MasterCrudTrait;

    protected $modelClass = Employee::class;
    protected $withRelations = ['shop', 'department', 'expenseCategory'];

    protected function validationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'employee_code' => 'required|string|max:30|unique:employees,employee_code,' . $id,
            'mobile' => 'nullable|string|max:20',
            'department_id' => 'nullable|exists:departments,id',
            'expense_category_id' => 'nullable|exists:expense_categories,id',
            'shop_id' => 'nullable|exists:shops,id',
            'designation' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ];
    }
}
