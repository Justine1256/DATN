<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_method', ['COD', 'Card', 'Wallet']);
            $table->enum('payment_status', ['Pending', 'Completed', 'Failed'])->default('Pending');
            $table->enum('order_status', ['Pending', 'Shipped', 'Delivered', 'Canceled'])->default('Pending');
            $table->text('shipping_address');
            $table->foreignId('discount_id')->nullable()->constrained('discounts')->nullOnDelete(); // nullable FK
            $table->timestamps(); // created_at & updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
