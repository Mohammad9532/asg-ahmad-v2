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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->after('id')->nullable()->constrained('roles')->nullOnDelete();
            $table->foreignId('shop_id')->after('role_id')->nullable()->constrained('shops')->nullOnDelete();
            $table->boolean('is_active')->after('password')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['shop_id']);
            $table->dropColumn(['role_id', 'shop_id', 'is_active']);
        });
    }
};
