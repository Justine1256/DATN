<?php

use App\Http\Controllers\AIController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShopController;


// test api
    Route::get('/userall', [UserController::class, 'index']);


Route::post('/check-content', [AIController::class, 'check']);


Route::get('/category', [CategoryController::class, 'index']);
Route::get('/category/{id}', [CategoryController::class, 'show']);
Route::post('/category', [CategoryController::class, 'store']);
Route::patch('/category/{id}', [CategoryController::class, 'update']);
Route::delete('/category/{id}', [CategoryController::class, 'delete']);

Route::get('/product', [ProductController::class, 'index']);
Route::get('/product/{slug}', [ProductController::class, 'show']);
Route::get('/bestSellingProducts', [ProductController::class, 'bestSellingProducts']);
Route::get('/topDiscountedProducts', [ProductController::class, 'topDiscountedProducts']);
Route::get('/newProducts', [ProductController::class, 'newProducts']);
Route::post('/product', [ProductController::class, 'store']);
Route::patch('/product/{id}', [ProductController::class, 'update']);
Route::delete('/product/{id}', [ProductController::class, 'delete']);

Route::post('/register', [UserController::class, 'register']);
Route::post('/verify-otp', [UserController::class, 'verifyOtp']);
Route::post('/login', [UserController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // User
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::delete('/user', [UserController::class, 'destroy']);

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::patch('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::get('/cart/total', [CartController::class, 'getTotal']);

    // Shop
    Route::post('/shopregister', [ShopController::class, 'sendOtp']);
    Route::post('/shopotp', [ShopController::class, 'confirmOtp']);
    Route::post('/shopexit', [ShopController::class, 'exitShop']);
});
