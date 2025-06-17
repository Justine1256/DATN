<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/danh-muc-hien-thi', [CategoryController::class, 'viewList']);
Route::get('/phpinfo', function () {
    phpinfo();
});
