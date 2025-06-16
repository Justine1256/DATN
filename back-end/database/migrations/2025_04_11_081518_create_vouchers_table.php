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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->decimal('max_discount_value', 10, 2)->nullable();
            $table->decimal('min_order_value', 10, 2)->default(0);
            $table->boolean('is_free_shipping')->default(false);
            $table->integer('usage_limit')->nullable();
            $table->integer('usage_count')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
