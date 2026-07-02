<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shop;
use App\Models\PaymentMethod;
use App\Models\Department;
use App\Models\ExpenseCategory;
use App\Models\ExpenseMaster;
use App\Models\Employee;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () {
            // 1. Default Shop
            $shop = Shop::firstOrCreate(
                ['code' => 'NFE'],
                [
                    'name' => 'Natural Fresh Express',
                    'is_active' => true,
                ]
            );

            // Update Super Admin shop
            $superAdmin = \App\Models\User::where('email', 'admin@asg-erp.com')->first();
            if ($superAdmin) {
                $superAdmin->update([
                    'shop_id' => $shop->id,
                ]);
            }

            // 2. Payment Methods
            $paymentMethods = [
                'Cash',
                'Card',
                'Bank',
                'UPI',
                'Wallet',
            ];

            foreach ($paymentMethods as $name) {
                PaymentMethod::firstOrCreate(
                    ['name' => $name],
                    ['is_active' => true]
                );
            }

            // 3. Departments
            $departments = [
                ['name' => 'Sales'],
                ['name' => 'Production'],
            ];

            foreach ($departments as $deptData) {
                $department = Department::firstOrCreate(
                    ['name' => $deptData['name']],
                    ['is_active' => true]
                );

                // 4. Expense Categories (per department)
                if ($deptData['name'] === 'Sales') {
                    $category = ExpenseCategory::firstOrCreate(
                        ['name' => 'Maintenance'],
                        ['department_id' => $department->id, 'is_active' => true]
                    );

                    // 5. Expense Masters
                    ExpenseMaster::firstOrCreate(
                        ['name' => 'Store Cleaning'],
                        ['expense_category_id' => $category->id, 'is_active' => true]
                    );
                }
            }

            // 6. Employee
            Employee::firstOrCreate(
                ['employee_code' => 'EMP001'],
                [
                    'name' => 'Test Employee',
                    'mobile' => '0501234567',
                    'is_active' => true,
                ]
            );
        });
    }
}
