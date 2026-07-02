<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the expenses.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Expense::with([
            'shop', 
            'department', 
            'expenseCategory', 
            'expenseMaster', 
            'employee', 
            'paymentMethod',
            'creator',
            'updater'
        ]);

        // Search: Expense Master Name, Remarks, Employee Name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('remarks', 'like', "%{$search}%")
                  ->orWhereHas('expenseMaster', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('employee', function ($q3) use ($search) {
                      $q3->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Exact match Filters
        $exactFilters = [
            'shop_id', 
            'department_id', 
            'expense_category_id', 
            'expense_master_id', 
            'employee_id', 
            'payment_method_id'
        ];

        foreach ($exactFilters as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        } elseif ($request->filled('start_date')) {
            $query->where('expense_date', '>=', $request->input('start_date'));
        } elseif ($request->filled('end_date')) {
            $query->where('expense_date', '<=', $request->input('end_date'));
        }

        // Filter by amount range
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->input('min_amount'));
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->input('max_amount'));
        }

        // Sorting
        $query->orderBy('expense_date', 'desc')->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->input('per_page', 15);
        $expenses = $query->paginate($perPage);

        return ExpenseResource::collection($expenses);
    }

    /**
     * Store a newly created expense in storage.
     */
    public function store(StoreExpenseRequest $request): ExpenseResource
    {
        return DB::transaction(function () use ($request) {
            $expense = Expense::create($request->validated());
            
            $expense->load([
                'shop', 'department', 'expenseCategory', 
                'expenseMaster', 'employee', 'paymentMethod',
                'creator', 'updater'
            ]);

            return new ExpenseResource($expense);
        });
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense): ExpenseResource
    {
        Gate::authorize('view', $expense);
        $expense->load([
            'shop', 'department', 'expenseCategory', 
            'expenseMaster', 'employee', 'paymentMethod',
            'creator', 'updater'
        ]);
        return new ExpenseResource($expense);
    }

    /**
     * Update the specified expense in storage.
     */
    public function update(UpdateExpenseRequest $request, Expense $expense): ExpenseResource
    {
        Gate::authorize('update', $expense);

        return DB::transaction(function () use ($request, $expense) {
            $expense->update($request->validated());
            
            $expense->load([
                'shop', 'department', 'expenseCategory', 
                'expenseMaster', 'employee', 'paymentMethod',
                'creator', 'updater'
            ]);

            return new ExpenseResource($expense);
        });
    }

    /**
     * Remove the specified expense from storage.
     */
    public function destroy(Expense $expense): Response
    {
        Gate::authorize('delete', $expense);

        return DB::transaction(function () use ($expense) {
            // TODO: Ledger phase: Ledger exists? YES -> Reject, NO -> Delete

            $expense->delete();
            return response()->noContent();
        });
    }
}
