<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Department;
use App\Models\ExpenseCategory;
use App\Models\ExpenseMaster;
use App\Models\Employee;
use App\Models\PaymentMethod;
use App\Models\Shop;

class LookupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'shops' => Shop::select('id', 'name')->get(),
            'departments' => Department::select('id', 'name')->get(),
            'expense_categories' => ExpenseCategory::select('id', 'name', 'department_id')->get(),
            'expense_masters' => ExpenseMaster::with('expenseCategory')->select('id', 'name', 'expense_category_id', 'is_active')
                                              ->where('is_active', true)
                                              ->get(),
            'employees' => Employee::select('id', 'name', 'employee_code', 'shop_id', 'department_id', 'expense_category_id')
                                   ->where('is_active', true)
                                   ->get(),
            'payment_methods' => PaymentMethod::select('id', 'name')->get(),
        ]);
    }
}
