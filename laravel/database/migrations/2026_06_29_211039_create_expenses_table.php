<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('shop_id')->constrained('shops');
            $table->foreignId('department_id')->constrained('departments');
            $table->foreignId('expense_category_id')->constrained('expense_categories');
            $table->foreignId('expense_master_id')->constrained('expense_masters');
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('payment_method_id')->constrained('payment_methods');
            
            $table->date('expense_date');
            
            $table->decimal('amount', 10, 2);
            $table->text('remarks')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Indexes as requested
            $table->index('shop_id');
            $table->index('department_id');
            $table->index('expense_category_id');
            $table->index('expense_master_id');
            $table->index('employee_id');
            $table->index('payment_method_id');
            $table->index('expense_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
