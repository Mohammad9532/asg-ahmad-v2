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
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->after('mobile')->constrained('departments')->nullOnDelete();
            $table->foreignId('expense_category_id')->nullable()->after('department_id')->constrained('expense_categories')->nullOnDelete();
            
            $table->index('shop_id');
            $table->index('department_id');
            $table->index('expense_category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['shop_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['expense_category_id']);
            $table->dropColumn(['shop_id', 'department_id', 'expense_category_id']);
        });
    }
};
