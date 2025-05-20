<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;


Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/danh-muc', [CategoryController::class, 'index']);
Route::get('/danh-muc/{id}', [CategoryController::class, 'show']);
Route::post('/danh-muc', [CategoryController::class, 'store']);
Route::patch('/danh-muc/{id}', [CategoryController::class, 'update']);
Route::delete('/danh-muc/{id}', [CategoryController::class, 'delete']);
