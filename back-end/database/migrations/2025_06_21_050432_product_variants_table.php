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
        Schema::create('product_variants', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('product_id');
        $table->string('option1')->nullable();
        $table->string('value1')->nullable();
        $table->string('option2')->nullable();
        $table->string('value2')->nullable();
        $table->decimal('price', 10, 2)->default(0);
        $table->integer('stock')->default(0);
        $table->json('image')->nullable();
        $table->timestamps();

        $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
    });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
