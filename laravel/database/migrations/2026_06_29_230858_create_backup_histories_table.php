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
        Schema::create('backup_histories', function (Blueprint $table) {
            $table->id();
            $table->string('filename')->unique();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->string('status')->default('Pending'); // Success, Failed
            $table->integer('execution_time_ms')->default(0);
            $table->text('error_message')->nullable();
            
            $table->string('restore_token')->nullable();
            $table->timestamp('restore_token_expires_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_histories');
    }
};
