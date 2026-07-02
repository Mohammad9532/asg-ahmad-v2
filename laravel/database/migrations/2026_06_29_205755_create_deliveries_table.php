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
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('shop_id')
                  ->constrained('shops')
                  ->cascadeOnDelete();
                  
            $table->foreignId('booking_id')
                  ->unique()
                  ->constrained('bookings')
                  ->cascadeOnDelete();
                  
            $table->date('delivery_date');
            

                  
            $table->text('remarks')->nullable();
            
            $table->timestamps();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
