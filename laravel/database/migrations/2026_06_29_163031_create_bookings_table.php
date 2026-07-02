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
    Schema::create('bookings', function (Blueprint $table) {
        $table->id();

        $table->foreignId('shop_id')
              ->constrained()
              ->cascadeOnDelete();

        $table->string('bill_no', 30);

        $table->date('booking_date');

        $table->string('customer_name', 150);
        $table->string('country_code', 10);
        $table->string('mobile', 20);

        $table->unsignedInteger('pcs');

        $table->decimal('booking_amount', 10, 2);

        $table->decimal('advance_amount', 10, 2)->default(0);

        $table->string('advance_payment_method', 30)->nullable();

        $table->decimal('total_paid', 10, 2)->default(0);
        $table->decimal('remaining_balance', 10, 2)->default(0);

        $table->tinyInteger('status')->default(0)->comment('0=Stock, 1=Partially Paid, 2=Fully Paid, 3=Delivered, 4=Cancelled');

        $table->text('remarks')->nullable();

        $table->timestamps();

        $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

        $table->unique(['shop_id', 'bill_no']);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
