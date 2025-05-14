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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('username', 50)->unique();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->string('email')->unique();
            $table->string('phone', 20)->unique();
            $table->enum('role',['admin','user','seller','staff'])->default('user');
            $table->enum('rank',['member','bronze','silver','gold','diamond'])->default('member');
            $table->enum('status',['activated','locked','hidden'])->default('activated');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('verify_token', 100)->nullable()->unique();
            $table->rememberToken();
            $table->timestamps();

        });


    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
