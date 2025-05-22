<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/danh-muc', [CategoryController::class, 'index']);
Route::get('/danh-muc/{id}', [CategoryController::class, 'show']);
Route::post('/danh-muc', [CategoryController::class, 'store']);
Route::patch('/danh-muc/{id}', [CategoryController::class, 'update']);
Route::delete('/danh-muc/{id}', [CategoryController::class, 'delete']);

Route::get('/san-pham', [ProductController::class, 'index']);
Route::get('/san-pham/{id}', [ProductController::class, 'show']);
Route::post('/san-pham', [ProductController::class, 'store']);
Route::patch('/san-pham/{id}', [ProductController::class, 'update']);
Route::delete('/san-pham/{id}', [ProductController::class, 'delete']);
