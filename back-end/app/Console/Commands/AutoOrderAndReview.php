<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Review;
use App\Models\Address;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AutoOrderAndReview extends Command
{
    protected $signature = 'order:fake-reviews
        {product_id : ID sản phẩm}
        {count : Số lượt đặt + đánh giá}
        {--min=4 : Sao nhỏ nhất (1..5)}
        {--max=5 : Sao lớn nhất (1..5)}
        {--user_id= : ID user cố định; nếu bỏ trống sẽ tự tạo/luân phiên}
        {--qty=1 : Số lượng/đơn}';

    protected $description = 'Tự động đặt hàng sản phẩm rồi chuyển Delivered và tạo đánh giá (random sao, image=null).';

    public function handle()
    {
        $productId = (int) $this->argument('product_id');
        $count     = (int) $this->argument('count');
        $minStar   = (int) $this->option('min');
        $maxStar   = (int) $this->option('max');
        $fixedUser = $this->option('user_id') ? (int) $this->option('user_id') : null;
        $qty       = max(1, (int) $this->option('qty'));

        if ($count <= 0) {
            $this->error('count phải > 0');
            return Command::FAILURE;
        }
        if (!in_array($minStar, [1,2,3,4,5]) || !in_array($maxStar, [1,2,3,4,5]) || $minStar > $maxStar) {
            $this->error('Khoảng sao không hợp lệ. Dùng --min=1..5, --max=1..5 và min<=max');
            return Command::FAILURE;
        }

        /** @var Product|null $product */
        $product = Product::query()->find($productId);
        if (!$product) {
            $this->error("Không tìm thấy sản phẩm ID={$productId}");
            return Command::FAILURE;
        }

        $this->info(">>> Bắt đầu tạo {$count} đơn+đánh giá cho sản phẩm #{$product->id} - {$product->name}");

        // chuẩn bị danh sách user dùng để gán review
        $usersPool = collect();
        if ($fixedUser) {
            $u = User::find($fixedUser);
            if (!$u) { $this->error("User {$fixedUser} không tồn tại"); return Command::FAILURE; }
            $usersPool->push($u);
        } else {
            // lấy vài user thường; nếu ít quá sẽ tự tạo mới
            $usersPool = User::query()
                ->when(method_exists(User::class, 'isAdmin'), fn($q) => $q->where(function($qq){
                    // nếu bạn có cột/role admin thì loại ra ở đây
                }))
                ->limit(5)
                ->get();
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 1; $i <= $count; $i++) {
            DB::beginTransaction();
            try {
                // 1) Chọn user
                /** @var User $user */
                $user = $usersPool->isNotEmpty()
                    ? $usersPool[($i - 1) % $usersPool->count()]
                    : $this->createFakeUser();

                // 2) Đảm bảo user có 1 địa chỉ
                $address = Address::where('user_id', $user->id)->first();
                if (!$address) {
                    $address = Address::create([
                        'user_id'   => $user->id,
                        'full_name' => $user->name ?? 'Test User',
                        'address'   => 'Số 1, Đường Test',
                        'city'      => 'Hà Nội',
                        'phone'     => '0900000000',
                        'email'     => $user->email ?? 'no-reply@example.com',
                    ]);
                }

                // 3) Khóa kho, tính giá tại thời điểm đặt
                $lockedProduct = Product::query()
                    ->select('id','name','price','sale_price','stock','shop_id','category_id')
                    ->lockForUpdate()
                    ->findOrFail($product->id);

                $variant = null;
                // nếu bạn muốn dùng biến thể, lấy biến thể có stock > 0
                if (class_exists(ProductVariant::class)) {
                    $variant = ProductVariant::query()
                        ->select('id','price','sale_price','stock')
                        ->where('product_id', $lockedProduct->id)
                        ->where('stock', '>=', $qty)
                        ->orderBy('id')
                        ->first();
                }

                $priceAtTime = $variant
                    ? ($variant->sale_price ?? $variant->price)
                    : ($lockedProduct->sale_price ?? $lockedProduct->price);

                // 4) Kiểm kho đủ
                if ($variant) {
                    if ($variant->stock < $qty) {
                        throw new \RuntimeException("Biến thể không đủ kho");
                    }
                    $variant->decrement('stock', $qty);
                } else {
                    if ($lockedProduct->stock < $qty) {
                        throw new \RuntimeException("Sản phẩm không đủ kho");
                    }
                    $lockedProduct->decrement('stock', $qty);
                }

                // 5) Tạo order (mặc định COD)
                $subtotal   = $qty * $priceAtTime;
                $final      = $subtotal; // không voucher
                $order = Order::create([
                    'user_id'          => $user->id,
                    'shop_id'          => $lockedProduct->shop_id,
                    'voucher_id'       => null,
                    'discount_amount'  => 0,
                    'total_amount'     => $subtotal,
                    'final_amount'     => $final,
                    'payment_method'   => 'COD',       // enum của bạn: COD|vnpay
                    'payment_status'   => 'Paid',      // hoặc Pending tuỳ bạn
                    'order_status'     => 'Delivered', // ĐỂ REVIEW HỢP LỆ
                    'shipping_status'  => 'Delivered',
                    'shipping_address' => json_encode([
                        'full_name' => $address->full_name,
                        'address'   => $address->address,
                        'city'      => $address->city,
                        'phone'     => $address->phone,
                        'email'     => $address->email,
                    ], JSON_UNESCAPED_UNICODE),
                    'confirmed_at'     => now(),
                    'shipped_at'       => now(),
                    'delivered_at'     => now(),
                    'order_admin_status' => 'Paid',
                ]);

                // 6) Tạo order detail
                $detail = OrderDetail::create([
                    'order_id'       => $order->id,
                    'product_id'     => $lockedProduct->id,
                    'variant_id'     => $variant?->id,
                    'product_option' => null,
                    'product_value'  => null,
                    'price_at_time'  => $priceAtTime,
                    'quantity'       => $qty,
                    'subtotal'       => $subtotal,
                ]);

                // 7) Tăng sold
                Product::whereKey($lockedProduct->id)->increment('sold', $qty);

                // 8) Tạo review (random sao, image=null)
                $rating = random_int($minStar, $maxStar);
                $comment = "Auto review {$i}/{$count} - rating {$rating}★";

                // tránh trùng lặp review cho cùng order_detail
                if (!Review::where('order_detail_id', $detail->id)->exists()) {
                    Review::create([
                        'user_id'         => $user->id,
                        'order_detail_id' => $detail->id,
                        'rating'          => $rating,
                        'comment'         => $comment,
                        'image'           => null,       // yêu cầu: image null
                        'status'          => 'approved', // hoặc 'pending' tùy flow
                    ]);
                }

                DB::commit();
                $bar->advance();
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("\n[Lỗi vòng {$i}]: " . $e->getMessage());
                // tiếp tục vòng tiếp theo
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Hoàn tất.");

        return Command::SUCCESS;
    }

    /** Tạo nhanh 1 user giả nếu không có user sẵn */
    protected function createFakeUser(): User
    {
        $email = 'reviewer+'.Str::random(8).'@example.com';
        return User::create([
            'name'     => 'Auto Reviewer',
            'email'    => $email,
            'password' => bcrypt('secret123'), // chỉ để test
        ]);
    }
}
