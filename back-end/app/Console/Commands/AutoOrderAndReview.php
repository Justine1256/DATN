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
        {product_id? : ID sản phẩm; bỏ trống khi dùng --all}
        {count? : Số lượt đặt + đánh giá; khi --all hoặc sản phẩm CHƯA có review thì auto 20–60% stock}
        {--all : Tạo cho TẤT CẢ sản phẩm chưa có review}
        {--min=4 : Sao nhỏ nhất (1..5)}
        {--max=5 : Sao lớn nhất (1..5)}
        {--user_id= : ID user cố định; nếu bỏ trống sẽ random từ bảng users}
        {--qty=1 : Số lượng/đơn}
        {--chunk=200 : Số sản phẩm xử lý mỗi đợt khi --all}';

    protected $description = 'Đặt hàng & đánh giá tự động (random user, random sao, image=null). Hỗ trợ 1 sản phẩm hoặc quét tất cả chưa có review.';

    public function handle()
    {
        $minStar   = (int) $this->option('min');
        $maxStar   = (int) $this->option('max');
        $fixedUser = $this->option('user_id') ? (int) $this->option('user_id') : null;
        $qty       = max(1, (int) $this->option('qty'));

        if (!in_array($minStar, [1,2,3,4,5]) || !in_array($maxStar, [1,2,3,4,5]) || $minStar > $maxStar) {
            $this->error('Khoảng sao không hợp lệ. Dùng --min=1..5, --max=1..5 và min<=max');
            return self::FAILURE;
        }

        // Chuẩn bị pool user
        if ($fixedUser) {
            $usersPool = collect([User::findOrFail($fixedUser)]);
        } else {
            $usersPool = $this->buildUsersPool();
            if ($usersPool->isEmpty()) {
                $usersPool = collect([$this->createFakeUser()]);
            }
        }

        // Chế độ ALL: quét mọi sản phẩm chưa có review
        if ($this->option('all')) {
            $chunk = max(50, (int) $this->option('chunk'));
            $this->info(">>> Bắt đầu quét tất cả sản phẩm CHƯA có review (chunk {$chunk})");

            $totalDone = 0;
            $query = Product::query()
                ->where('stock', '>', 0)
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                      ->from('order_details as od')
                      ->join('reviews as r', 'r.order_detail_id', '=', 'od.id')
                      ->whereColumn('od.product_id', 'products.id');
                });

            // (tuỳ DB) bạn có thể thêm điều kiện status:
            // ->where('status', 'activated')

            $query->chunkById($chunk, function ($products) use ($minStar, $maxStar, $usersPool, $fixedUser, $qty, &$totalDone) {
                foreach ($products as $product) {
                    // autoCount = 20–60% stock (chia theo qty), tối thiểu 1
                    $autoCount = $this->autoCountFromStock((int)$product->stock, $qty);
                    if ($autoCount <= 0) continue;

                    $this->line("→ #{$product->id} {$product->name} | stock={$product->stock} | sẽ tạo {$autoCount} review");

                    $created = $this->processProduct($product, $autoCount, $minStar, $maxStar, $qty, $usersPool, $fixedUser);
                    $totalDone += $created;
                }
            });

            $this->info(">>> Hoàn tất. Đã tạo {$totalDone} review (qua nhiều đơn).");
            return self::SUCCESS;
        }

        // Chế độ 1 sản phẩm (giữ tương thích)
        $productId = (int) ($this->argument('product_id') ?? 0);
        if ($productId <= 0) {
            $this->error('Thiếu product_id hoặc dùng --all để quét toàn bộ.');
            return self::FAILURE;
        }

        /** @var Product|null $product */
        $product = Product::query()->find($productId);
        if (!$product) {
            $this->error("Không tìm thấy sản phẩm ID={$productId}");
            return self::FAILURE;
        }

        // Nếu sản phẩm CHƯA có review → auto 20–60% stock
        $hasReview = $this->productHasReview($product->id);
        $countArg  = $this->argument('count');
        $count     = $hasReview
            ? max(1, (int) $countArg)
            : $this->autoCountFromStock((int)$product->stock, $qty);

        if ($count <= 0) {
            $this->warn("Stock không đủ để tạo đơn (stock={$product->stock}, qty={$qty}). Bỏ qua.");
            return self::SUCCESS;
        }

        $this->info(">>> Bắt đầu tạo {$count} đơn+đánh giá cho #{$product->id} - {$product->name}");
        $created = $this->processProduct($product, $count, $minStar, $maxStar, $qty, $usersPool, $fixedUser);
        $this->info("Hoàn tất. Đã tạo {$created} review.");
        return self::SUCCESS;
    }

    /** Tính số lượt review = 20–60% stock (theo qty) */
    protected function autoCountFromStock(int $stock, int $qty): int
    {
        if ($stock <= 0 || $qty <= 0) return 0;
        $min = (int) ceil($stock * 0.20 / $qty);
        $max = (int) floor($stock * 0.60 / $qty);
        if ($max < 1) return 0;
        if ($min < 1) $min = 1;
        if ($min > $max) $min = $max;
        return random_int($min, $max);
    }

    /** Kiểm tra sản phẩm đã có review chưa (qua order_details → reviews) */
    protected function productHasReview(int $productId): bool
    {
        return DB::table('order_details as od')
            ->join('reviews as r', 'r.order_detail_id', '=', 'od.id')
            ->where('od.product_id', $productId)
            ->exists();
    }

    /** Xử lý tạo n đơn + review cho 1 product, trả về số review tạo được */
    protected function processProduct(Product $product, int $count, int $minStar, int $maxStar, int $qty, $usersPool, ?int $fixedUser): int
    {
        $created = 0;
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        for ($i = 1; $i <= $count; $i++) {
            DB::beginTransaction();
            try {
                /** @var User $user */
                $user = $fixedUser ? $usersPool->first() : $usersPool->random();

                // địa chỉ
                $address = $this->getOrCreateAddress($user);

                // lock sản phẩm
                $locked = Product::query()
                    ->select('id','name','price','sale_price','stock','shop_id','category_id')
                    ->lockForUpdate()
                    ->findOrFail($product->id);

                $variant = null;
                if (class_exists(ProductVariant::class)) {
                    $variant = ProductVariant::query()
                        ->select('id','price','sale_price','stock')
                        ->where('product_id', $locked->id)
                        ->where('stock', '>=', $qty)
                        ->orderBy('id')
                        ->first();
                }

                // kiểm kho
                if ($variant) {
                    if ($variant->stock < $qty) throw new \RuntimeException('Biến thể không đủ kho');
                } else {
                    if ($locked->stock < $qty) throw new \RuntimeException('Sản phẩm không đủ kho');
                }

                $priceAtTime = $variant
                    ? ($variant->sale_price ?? $variant->price)
                    : ($locked->sale_price ?? $locked->price);

                // trừ kho
                if ($variant) $variant->decrement('stock', $qty);
                else $locked->decrement('stock', $qty);

                // tạo order
                $subtotal = $qty * $priceAtTime;
                $final    = $subtotal;

                $order = Order::create([
                    'user_id'          => $user->id,
                    'shop_id'          => $locked->shop_id,
                    'voucher_id'       => null,
                    'discount_amount'  => 0,
                    'total_amount'     => $subtotal,
                    'final_amount'     => $final,
                    'payment_method'   => 'COD',
                    'payment_status'   => 'Pending',   // bảo toàn enum
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
                    'order_admin_status' => 'Unpaid',
                ]);

                // order detail
                $detail = OrderDetail::create([
                    'order_id'       => $order->id,
                    'product_id'     => $locked->id,
                    'variant_id'     => $variant?->id,
                    'product_option' => null,
                    'product_value'  => null,
                    'price_at_time'  => $priceAtTime,
                    'quantity'       => $qty,
                    'subtotal'       => $subtotal,
                ]);

                // tăng sold
                Product::whereKey($locked->id)->increment('sold', $qty);

                // review
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
                    $created++;
                }

                DB::commit();
                $bar->advance();
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("\n[Lỗi]: ".$e->getMessage());
            }
        }

        $bar->finish();
        $this->newLine();
        return $created;
    }

    /** Pool user (loại admin nếu có cột phù hợp) */
    protected function buildUsersPool()
    {
        $userTable = (new User())->getTable();
        $cols      = Schema::getColumnListing($userTable);

        $q = User::query();

        if (in_array('is_admin', $cols)) {
            $q->where(function($qq){
                $qq->where('is_admin', false)->orWhereNull('is_admin');
            });
        }
        if (in_array('role', $cols)) {
            $q->where(function($qq){
                $qq->where('role', 'user')
                   ->orWhere('role', 'customer')
                   ->orWhereNull('role');
            });
        }
        if (in_array('status', $cols)) {
            $q->where('status', '!=', 'banned');
        }

        return $q->select('id','name','email')->get();
    }

    /** Tạo 1 user giả nếu DB trống */
    protected function createFakeUser(): User
    {
        $email = 'reviewer+'.Str::random(8).'@example.com';
        return User::create([
            'name'     => 'Auto Reviewer',
            'email'    => $email,
            'password' => bcrypt('secret123'),
        ]);
    }

    /** Đảm bảo có địa chỉ theo schema hiện tại */
    protected function getOrCreateAddress(User $user): Address
    {
        $existing = Address::where('user_id', $user->id)->first();
        if ($existing) return $existing;

        $table = (new Address())->getTable();
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

    /** Random comment (tích hợp pool 50 câu chung chung) */
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
            "Mua dùng thử và kết quả ngoài mong đợi."
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
            "Chưa dùng lâu nên chưa nhận xét được độ bền."
        ];

        $pool = ($rating >= 4) ? $positives : $neutrals;
        $tpl  = $pool[array_rand($pool)];
        return str_replace('{name}', $productName, $tpl);
    }
}
