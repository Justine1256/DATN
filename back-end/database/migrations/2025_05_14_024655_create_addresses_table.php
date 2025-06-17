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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('full_name');
            $table->string('phone');
            $table->string('address'); // Số nhà, tên đường
            $table->string('ward');    // Phường/Xã
            $table->string('district'); // Quận/Huyện
            $table->string('city');    // Tỉnh/Thành phố
            $table->string('province'); // Tên tỉnh nếu bạn vẫn muốn giữ (hoặc có thể gộp chung với city)
            $table->text('note')->nullable(); // Ghi chú giao hàng
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
