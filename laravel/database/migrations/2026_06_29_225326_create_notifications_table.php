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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->nullable()->constrained('shops')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->string('title', 150);
            $table->text('message');
            
            $table->string('category', 50); // SYSTEM, SECURITY, BOOKING, etc.
            $table->string('type', 100);
            $table->enum('priority', ['Low', 'Normal', 'High', 'Critical'])->default('Normal');
            $table->string('icon', 50)->nullable();
            
            $table->string('action_url')->nullable();
            
            $table->string('reference_type', 150)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            $table->boolean('is_archived')->default(false);
            $table->timestamp('expires_at')->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            // Indexes
            $table->index('shop_id');
            $table->index('user_id');
            $table->index('category');
            $table->index('type');
            $table->index('priority');
            $table->index('is_read');
            $table->index('is_archived');
            $table->index(['reference_type', 'reference_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
