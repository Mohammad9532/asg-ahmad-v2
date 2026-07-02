<?php

namespace App\Http\Requests;

use App\Models\ExpenseMaster;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_id' => ['required', 'exists:shops,id'],
            'department_id' => ['required', 'exists:departments,id'],
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'expense_master_id' => ['nullable', 'required_without:employee_id', 'exists:expense_masters,id'],
            'employee_id' => ['nullable', 'required_without:expense_master_id', 'exists:employees,id'],
            'payment_method_id' => ['required', 'exists:payment_methods,id'],
            'expense_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'remarks' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $master = ExpenseMaster::with('expenseCategory')->find($this->expense_master_id);

            if ($master) {
                // Check if the master belongs to the given category
                if ($master->expense_category_id != $this->expense_category_id) {
                    $validator->errors()->add('expense_master_id', 'The selected expense master does not belong to the selected expense category.');
                }
                
                // Check if the category belongs to the given department
                if ($master->expenseCategory && $master->expenseCategory->department_id != $this->department_id) {
                    $validator->errors()->add('expense_category_id', 'The selected expense category does not belong to the selected department.');
                }
            }
        });
    }
}
