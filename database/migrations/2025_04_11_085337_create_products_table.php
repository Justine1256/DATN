<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Dùng foreignId + constrained cho khóa ngoại
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('stock')->default(0);
            $table->integer('sold')->default(0);
            $table->string('image')->nullable();
            $table->string('option1')->nullable();
            $table->string('value1')->nullable();
            $table->string('option2')->nullable();
            $table->string('value2')->nullable();
            $table->enum('status', ['actived', 'deleted'])->default('actived');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
