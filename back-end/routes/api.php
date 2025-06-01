<?php

use App\Http\Controllers\AIController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderDetailController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VoucherUserController;
use App\Http\Controllers\VoucherCategoryController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\ReviewController;


// test api
Route::get('/userall', [UserController::class, 'index']);
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/upload-image', function (Request $request) {
    if (!$request->hasFile('file')) {
        return response()->json(['error' => 'No file provided'], 400);
    }

    $file = $request->file('file');

    if (!$file->isValid()) {
        return response()->json(['error' => 'Invalid file upload'], 400);
    }

    // Lưu file vào thư mục public/storage/uploads
    $path = $file->store('uploads', 'public');

    // Trả về url file vừa lưu (dùng asset helper hoặc Storage facade)
    $url = asset('storage/' . $path);

    return response()->json(['url' => $url]);
});

Route::get('/category', [CategoryController::class, 'index']);
Route::get('/category/{id}', [CategoryController::class, 'show']);
Route::post('/category', [CategoryController::class, 'store']);
Route::patch('/category/{id}', [CategoryController::class, 'update']);
Route::delete('/category/{id}', [CategoryController::class, 'delete']);

Route::get('/product', [ProductController::class, 'index']);
Route::get('/{shopslug}/product/{productslug}', [ProductController::class, 'show']);
Route::get('/bestsellingproducts', [ProductController::class, 'bestSellingProducts']);
Route::get('/topdiscountedproducts', [ProductController::class, 'topDiscountedProducts']);
Route::get('/newproducts', [ProductController::class, 'newProducts']);


Route::post('/product', [ProductController::class, 'store']);
Route::patch('/product/{id}', [ProductController::class, 'update']);
Route::delete('/product/{id}', [ProductController::class, 'delete']);




Route::post('/register', [UserController::class, 'register']);
Route::post('/verify-otp', [UserController::class, 'verifyOtp']);
Route::post('/login', [UserController::class, 'login']);

Route::get('/{shopslug}/product/{productslug}/comments', [CommentController::class, 'getCommentsInProduct']);

Route::get('/notification', [NotificationController::class, 'index']);
Route::post('/notification', [NotificationController::class, 'store']);
Route::get('/notification/{id}', [NotificationController::class, 'show']);
Route::delete('/notification/{id}', [NotificationController::class, 'destroy']);

Route::get('/reviews', [ReviewController::class, 'index']);
Route::get('/reviews/{id}', [ReviewController::class, 'show']);

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
    Route::get('/shopdashboard', [ShopController::class, 'index']);
    Route::post('/shopexit', [ShopController::class, 'exitShop']);

    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::patch('/addresses/{id}', [AddressController::class, 'update']);
    Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);

    Route::post('/dathang', [OrderController::class, 'checkout']);
    Route::get('/showdh', [OrderController::class, 'show']);
    Route::post('/cancel', [OrderController::class, 'cancel']);

    Route::get('/order-details', [OrderDetailController::class, 'index']);
    Route::post('/order-details', [OrderDetailController::class, 'store']);
    Route::get('/order-details/{id}', [OrderDetailController::class, 'show']);
    Route::patch('/order-details/{id}', [OrderDetailController::class, 'update']);
    Route::delete('/order-details/{id}', [OrderDetailController::class, 'destroy']);

    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Mã giảm giá
    Route::post('/voucher', [VoucherController::class, 'apply']);
    Route::post('/voucher-users', [VoucherUserController::class, 'assignToUser']);
    Route::post('/voucher-categories', [VoucherCategoryController::class, 'assignToCategory']);

    // bình luận
    Route::post('/{shopslug}/product/{productslug}/comment', [CommentController::class, 'addCommentIntoProduct']);
    Route::delete('/comment/{id}', [CommentController::class, 'destroy']);
    Route::post('/comment/{id}/restore', [CommentController::class, 'restore']);
    Route::patch('/comment/{id}', [CommentController::class, 'update']);

    // Theo dõi shop
    Route::post('/shops/{shopId}/follow', [FollowController::class, 'followShop']);
    Route::delete('/shops/{shopId}/unfollow', [FollowController::class, 'unfollowShop']);
    Route::get('/my/followed-shops', [FollowController::class, 'getFollowedShops']);
    Route::get('/shops/{shopId}/followers', [FollowController::class, 'getFollowersByShop']);

    // báo cáo shop
    Route::get('/reports', [ReportController::class, 'index']);       // admin xem danh sách
    Route::post('/reports', [ReportController::class, 'store']);      // user gửi report
    Route::get('/reports/{id}', [ReportController::class, 'show']);   // xem chi tiết report
    Route::put('/reports/{id}', [ReportController::class, 'update']); // admin đổi trạng thái
    Route::delete('/reports/{id}', [ReportController::class, 'destroy']); // tuỳ chọn

    // wish list
    Route::get('/wishlist', [WishlistController::class, 'index']);           // Lấy danh sách wishlist
    Route::post('/wishlist', [WishlistController::class, 'store']);          // Thêm sản phẩm vào wishlist
    Route::delete('/wishlist/{product_id}', [WishlistController::class, 'destroy']); // Xoá sản phẩm

    // tin nhắn
    Route::get('/messages', [MessageController::class, 'index']);         // Lấy tin nhắn giữa 2 user
    Route::post('/messages', [MessageController::class, 'store']);        // Gửi tin nhắn mới
    Route::patch('/messages/{id}/hide', [MessageController::class, 'hide']);   // Ẩn tin nhắn (status = hidden)
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);    // Xoá mềm tin nhắn

    // tính hoa hồng
    Route::get('/commissions', [CommissionController::class, 'index']); // DS hoa hồng
    Route::post('/commissions/calculate', [CommissionController::class, 'calculateAndStore']); // Tính & lưu hoa hồng
    Route::patch('/commissions/{id}/status', [CommissionController::class, 'updateStatus']); // Cập nhật trạng thái hoa hồng

    // shop management
    // quản lý sản phẩm  của shop
    Route::get('/shop/products', [ProductController::class, 'showShopProducts']);
    Route::post('/shop/products', [ProductController::class, 'addProductByShop']);
    Route::patch('/shop/products/{id}', [ProductController::class, 'update']);
    Route::delete('/shop/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/shop/products/{id}', [ProductController::class, 'restoreProduct']);
    // quản lý danh mục của shop
    Route::get('/shop/categories', [CategoryController::class, 'getShopCategories']);
    Route::post('/shop/categories', [CategoryController::class, 'addCategoryByShop']);
    Route::patch('/shop/categories/{id}', [CategoryController::class, 'updateCategoryByShop']);
    Route::delete('/shop/categories/{id}', [CategoryController::class, 'destroyCategoryByShop']);
    Route::post('/shop/categories/{id}', [CategoryController::class, 'restoreCategory']);
    // quản lý bình luận của shop
    Route::get('/shop/comments', [ProductController::class, 'getShopComments']);
    Route::delete('/shop/comments/{id}', [ProductController::class, 'deleteComment']);
    Route::post('/shop/comments/{id}', [ProductController::class, 'restoreComment']);
});
