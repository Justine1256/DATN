<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShopsTable extends Migration
{
    public function up()
    {
        Schema::create('shops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name', 100)->unique(); // Tên shop
            $table->string('slug')->unique();
            $table->string('description', 255); // Mô tả shop
            $table->string('logo')->nullable(); // Logo của shop
            $table->string('phone', 20)->nullable(); // Số điện thoại shop
            $table->string('email', 100)->nullable(); // Email shop
            $table->unsignedBigInteger('total_sales')->default(0); // Tổng đơn hàng đã bán
            $table->decimal('rating', 2, 1)->nullable(); // Đánh giá trung bình
            $table->enum('status', ['activated', 'locked', 'hidden'])->default('activated'); // Trạng thái
            $table->timestamps(); // created_at & updated_at
            $table->softDeletes(); // deleted_at
        });
    }

    public function down()
    {
        Schema::dropIfExists('shops');
    }
}
