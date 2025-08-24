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
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AutoOrderAndReview extends Command
{
    protected $signature = 'order:fake-reviews
        {product_id : ID sản phẩm}
        {count : Số lượt đặt + đánh giá}
        {--min=4 : Sao nhỏ nhất (1..5)}
        {--max=5 : Sao lớn nhất (1..5)}
        {--user_id= : ID user cố định; nếu bỏ trống sẽ random từ bảng users}
        {--qty=1 : Số lượng/đơn}';

    protected $description = 'Tự động đặt hàng sản phẩm rồi chuyển Delivered và tạo đánh giá (random user, random sao, image=null).';

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

        // ===== Pool user =====
        if ($fixedUser) {
            $usersPool = collect([User::findOrFail($fixedUser)]);
        } else {
            $usersPool = $this->buildUsersPool();
            if ($usersPool->isEmpty()) {
                // không có user -> tạo tạm 1 user
                $tmp = $this->createFakeUser();
                $usersPool = collect([$tmp]);
            }
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 1; $i <= $count; $i++) {
            DB::beginTransaction();
            try {
                /** @var User $user */
                $user = $fixedUser
                    ? $usersPool->first()
                    : $usersPool->random(); // ✅ random 1 user cho mỗi vòng

                // Địa chỉ đầy đủ cột theo schema
                $address = $this->getOrCreateAddress($user);

                // Khóa kho, tính giá tại thời điểm đặt
                $lockedProduct = Product::query()
                    ->select('id','name','price','sale_price','stock','shop_id','category_id')
                    ->lockForUpdate()
                    ->findOrFail($product->id);

                $variant = null;
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

                // Kiểm kho
                if ($variant) {
                    if ($variant->stock < $qty) throw new \RuntimeException("Biến thể không đủ kho");
                    $variant->decrement('stock', $qty);
                } else {
                    if ($lockedProduct->stock < $qty) throw new \RuntimeException("Sản phẩm không đủ kho");
                    $lockedProduct->decrement('stock', $qty);
                }

                // Tạo order (COD). Chọn status an toàn với enum phổ biến.
                $subtotal = $qty * $priceAtTime;
                $final    = $subtotal;

                $order = Order::create([
                    'user_id'          => $user->id,
                    'shop_id'          => $lockedProduct->shop_id,
                    'voucher_id'       => null,
                    'discount_amount'  => 0,
                    'total_amount'     => $subtotal,
                    'final_amount'     => $final,
                    'payment_method'   => 'COD',       // enum thường: COD|vnpay
                    'payment_status'   => 'Pending',   // tránh lỗi enum
                    'order_status'     => 'Delivered', // để ReviewController hợp lệ
                    'shipping_status'  => 'Delivered',
                    'shipping_address' => json_encode([
                        'full_name' => $address->full_name,
                        'address'   => $address->address,
                        'city'      => $address->city ?? null,
                        'province'  => $address->province ?? null,
                        'district'  => $address->district ?? null,
                        'ward'      => $address->ward ?? null,
                        'phone'     => $address->phone,
                        'email'     => $address->email ?? 'no-reply@example.com',
                    ], JSON_UNESCAPED_UNICODE),
                    'confirmed_at'       => now(),
                    'shipped_at'         => now(),
                    'delivered_at'       => now(),
                    'order_admin_status' => 'Unpaid',  // an toàn cho COD
                ]);

                // Order detail
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

                // tăng sold
                Product::whereKey($lockedProduct->id)->increment('sold', $qty);

                // Review (random sao & câu)
                $rating  = random_int($minStar, $maxStar);
                $comment = $this->randomCommentForRating($rating, $product->name);

                if (!Review::where('order_detail_id', $detail->id)->exists()) {
                    Review::create([
                        'user_id'         => $user->id,
                        'order_detail_id' => $detail->id,
                        'rating'          => $rating,
                        'comment'         => $comment,
                        'image'           => null,
                        'status'          => 'approved',
                    ]);
                }

                DB::commit();
                $bar->advance();
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("\n[Lỗi vòng {$i}]: " . $e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Hoàn tất.");

        return Command::SUCCESS;
    }

    /** Lấy pool user ngẫu nhiên (cố gắng loại admin nếu có cột phù hợp) */
    protected function buildUsersPool()
    {
        $userTable = (new User())->getTable();
        $cols      = Schema::getColumnListing($userTable);

        $q = User::query();

        if (in_array('is_admin', $cols)) {
            $q->where(function($qq) {
                $qq->where('is_admin', false)->orWhereNull('is_admin');
            });
        }
        if (in_array('role', $cols)) {
            $q->where(function($qq) {
                $qq->where('role', 'user')
                   ->orWhere('role', 'customer')
                   ->orWhereNull('role');
            });
        }
        if (in_array('status', $cols)) {
            $q->where('status', '!=', 'banned');
        }

        // lấy đủ để random trong memory
        return $q->select('id','name','email')->get();
    }

    /** Tạo nhanh 1 user giả nếu không có user sẵn */
    protected function createFakeUser(): User
    {
        $email = 'reviewer+'.Str::random(8).'@example.com';
        return User::create([
            'name'     => 'Auto Reviewer',
            'email'    => $email,
            'password' => bcrypt('secret123'),
        ]);
    }

    /** Tạo/đảm bảo địa chỉ với đủ cột theo schema hiện tại (fix lỗi ward không có default) */
    protected function getOrCreateAddress(User $user): Address
    {
        $existing = Address::where('user_id', $user->id)->first();
        if ($existing) return $existing;

        $table = (new Address())->getTable(); // 'addresses'
        $cols  = Schema::getColumnListing($table);

        $payload = [
            'user_id'    => $user->id,
            'full_name'  => $user->name ?? 'Auto Reviewer',
            'address'    => 'Số 1, Đường Test',
            'city'       => 'Hà Nội',
            'phone'      => '0900000000',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // set thêm nếu tồn tại cột
        if (in_array('email', $cols))     $payload['email']    = $user->email ?? 'no-reply@example.com';
        if (in_array('province', $cols))  $payload['province'] = 'Hà Nội';
        if (in_array('district', $cols))  $payload['district'] = 'Quận Hoàn Kiếm';
        if (in_array('ward', $cols))      $payload['ward']     = 'Phường Hàng Trống';
        if (in_array('country', $cols))   $payload['country']  = 'VN';
        if (in_array('postcode', $cols))  $payload['postcode'] = '100000';
        if (in_array('zip_code', $cols))  $payload['zip_code'] = '100000';

        $id = DB::table($table)->insertGetId($payload);

        return Address::findOrFail($id);
    }

    /** Random comment theo số sao với ~20 mẫu câu tiếng Việt */
    protected function randomCommentForRating(int $rating, string $productName): string
    {
        $positives = [
    "Sản phẩm {name} đúng mô tả, sử dụng yên tâm.",
    "Chất lượng tốt, hoàn thiện gọn gàng, đáng tiền.",
    "Đóng gói chắc chắn, giao hàng cẩn thận.",
    "Mua về dùng thấy ổn định, hài lòng.",
    "Giá hợp lý so với chất lượng mang lại.",
    "Thiết kế đẹp mắt, cảm giác sử dụng tốt.",
    "Phù hợp nhu cầu hằng ngày, recommend.",
    "Trải nghiệm mượt mà, không gặp vấn đề.",
    "Hàng mới, nguyên seal, đầy đủ phụ kiện.",
    "Tư vấn nhiệt tình, hỗ trợ nhanh.",
    "Sản phẩm hoạt động như kỳ vọng.",
    "Đáp ứng tốt nhu cầu công việc và cá nhân.",
    "Độ hoàn thiện ổn, cầm nắm chắc tay.",
    "Màu sắc/kiểu dáng như hình, rất ưng.",
    "Tổng thể vượt mong đợi trong tầm giá.",
    "Rất đáng tiền, sẽ ủng hộ shop lần sau.",
    "Dễ sử dụng, hướng dẫn rõ ràng.",
    "Giao hàng đúng hẹn, dịch vụ tốt.",
    "Tỉ lệ giá/hiệu quả quá ổn.",
    "Sản phẩm dùng ổn, chưa thấy lỗi.",
    "Hàng chất lượng, đáng để trải nghiệm.",
    "Đúng size/qui cách mô tả, không sai lệch.",
    "Sản phẩm {name} vận hành ổn định.",
    "Hoàn toàn hài lòng từ khâu đóng gói đến sản phẩm.",
    "Mua dùng thử và kết quả ngoài mong đợi.",
];

$neutrals = [
    "Sản phẩm đúng mô tả nhưng trải nghiệm ở mức ổn.",
    "Tạm ổn, cần cải thiện thêm một vài chi tiết.",
    "Giá hơi cao so với kỳ vọng cá nhân.",
    "Giao hơi chậm một chút, còn lại ổn.",
    "Đóng gói ổn nhưng vỏ hộp có vết móp nhẹ.",
    "Thiết kế bình thường, công năng đủ dùng.",
    "Chất lượng hợp lý tầm giá, chưa nổi bật.",
    "Hướng dẫn nên chi tiết hơn cho người mới.",
    "Màu sắc thực tế hơi khác ảnh một chút.",
    "Kích thước/qui cách ổn, chưa có điểm đặc biệt.",
    "Sản phẩm {name} dùng tạm được, cần thêm thời gian đánh giá.",
    "Phù hợp nhu cầu cơ bản, không quá khác biệt.",
    "Shop phản hồi hơi chậm nhưng vẫn hỗ trợ.",
    "Chất liệu/hoàn thiện ở mức trung bình.",
    "Đúng hàng đặt, trải nghiệm cần tối ưu thêm.",
    "Cần cải thiện khâu kiểm tra trước khi gửi.",
    "Một vài chi tiết hoàn thiện chưa đều.",
    "Tổng thể ổn, mong có phiên bản tốt hơn.",
    "Sản phẩm hoạt động bình thường, chưa thấy điểm trừ lớn.",
    "Đáp ứng mức sử dụng thông thường, tạm ổn.",
    "Đổi trả/CSKH nên nhanh hơn sẽ tuyệt.",
    "Tính thực dụng ổn, chưa thấy khác biệt lớn.",
    "Mua thử để trải nghiệm, nhìn chung ổn.",
    "Đúng như quảng cáo, nhưng chưa thật sự ấn tượng.",
    "Chưa dùng lâu nên chưa nhận xét được độ bền.",
];


        $pool = ($rating >= 4) ? $positives : $neutrals;
        $tpl  = $pool[array_rand($pool)];
        return str_replace('{name}', $productName, $tpl);
    }
}
