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
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();

            $table->string('transaction_no', 30)->unique();
            
            $table->foreignId('shop_id')
                  ->constrained('shops')
                  ->cascadeOnDelete();

            $table->date('entry_date');
            
            $table->string('transaction_type', 30); // DEBIT, CREDIT
            $table->string('source', 30); // PAYMENT, EXPENSE, etc.
            
            $table->string('reference_type', 150);
            $table->unsignedBigInteger('reference_id');
            
            $table->foreignId('payment_method_id')
                  ->nullable()
                  ->constrained('payment_methods')
                  ->nullOnDelete();

            $table->decimal('debit', 10, 2)->default(0);
            $table->decimal('credit', 10, 2)->default(0);
            
            $table->boolean('is_reversed')->default(false);
            
            $table->foreignId('reversal_of')
                  ->nullable()
                  ->constrained('ledgers')
                  ->nullOnDelete();

            $table->text('remarks')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            
            // Performance & Reporting Indexes
            $table->index('shop_id');
            $table->index('entry_date');
            $table->index('source');
            $table->index('payment_method_id');
            $table->index(['reference_type', 'reference_id']);
            $table->index('reversal_of');
            $table->index(['shop_id', 'entry_date']); // Composite Reporting Index
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ledgers');
    }
};
