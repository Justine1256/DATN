<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;
use App\Models\VoucherUser;
use Illuminate\Support\Facades\Auth;
use App\Models\Cart;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class VoucherController extends Controller
{
    // 1. Lấy danh sách tất cả voucher
    public function index()
    {
        $vouchers = Voucher::all();
        return response()->json($vouchers);
    }
    public function listvoucheradmin(Request $request)
    {
        $q = Voucher::query()
            ->whereNull('shop_id'); // voucher dùng chung

        // Tìm theo mã
        if ($search = $request->query('search')) {
            $q->where('code', 'like', "%{$search}%");
        }

        // Lọc theo trạng thái thời gian
        if ($status = $request->query('status')) {
            $now = Carbon::now();
            if ($status === 'active') {
                $q->whereDate('start_date', '<=', $now)->whereDate('end_date', '>=', $now);
            } elseif ($status === 'upcoming') {
                $q->whereDate('start_date', '>', $now);
            } elseif ($status === 'expired') {
                $q->whereDate('end_date', '<', $now);
            }
        }

        // Lọc theo khoảng ngày tạo voucher (optional)
        if ($from = $request->query('date_from')) {
            $q->whereDate('start_date', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $q->whereDate('end_date', '<=', $to);
        }

        // Sắp xếp
        $sort = $request->query('sort', '-created_at'); // mặc định mới nhất
        // ví dụ: sort=code hoặc sort=-end_date
        if (str_starts_with($sort, '-')) {
            $q->orderBy(ltrim($sort, '-'), 'desc');
        } else {
            $q->orderBy($sort, 'asc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $vouchers = $q->paginate($perPage);

        return response()->json([
            'message' => 'Danh sách voucher dùng chung',
            'data' => $vouchers
        ]);
    }
    public function listvouchershop(Request $request)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if (!$user || $user->role !== 'seller') {
            return response()->json(['message' => 'Bạn không có quyền xem voucher shop'], 403);
        }
        if (!$user->shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 400);
        }

        $q = Voucher::with('shop:id,name')->where('shop_id', $user->shop->id);

        if ($search = $request->query('search')) {
            $q->where('code', 'like', "%{$search}%");
        }

        if ($status = $request->query('status')) {
            $now = Carbon::now();
            if ($status === 'active') {
                $q->whereDate('start_date', '<=', $now)->whereDate('end_date', '>=', $now);
            } elseif ($status === 'upcoming') {
                $q->whereDate('start_date', '>', $now);
            } elseif ($status === 'expired') {
                $q->whereDate('end_date', '<', $now);
            }
        }

        if ($from = $request->query('date_from')) {
            $q->whereDate('start_date', '>=', $from);
        }
        if ($to = $request->query('date_to')) {
            $q->whereDate('end_date', '<=', $to);
        }

        $sort = $request->query('sort', '-created_at');
        if (str_starts_with($sort, '-')) {
            $q->orderBy(ltrim($sort, '-'), 'desc');
        } else {
            $q->orderBy($sort, 'asc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $vouchers = $q->paginate($perPage);

        return response()->json([
            'message' => 'Danh sách voucher của shop',
            'data' => $vouchers
        ]);
    }
    // 2. Tạo mới voucher
    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:vouchers,code',
            'discount_value' => 'required|numeric|min:0',
            'discount_type' => 'required|in:percent,fixed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'created_by' => 'nullable|exists:users,id',
        ]);

        if ($request->discount_type === 'percent' && $request->discount_value > 35) {
            return response()->json([
                'message' => 'Giá trị phần trăm giảm giá không được vượt quá 35%'
            ], 422);
        }
        $voucher = Voucher::create($request->all());
        return response()->json(['message' => 'Tạo voucher thành công', 'data' => $voucher], 201);
    }
    public function storeShopVoucher(Request $request)
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if (!$user || $user->role !== 'seller') {
            return response()->json(['message' => 'Bạn không có quyền tạo voucher shop'], 403);
        }
        if (!$user->shop) {
            return response()->json(['message' => 'Bạn chưa có shop để tạo voucher'], 400);
        }

        $request->validate([
            'code' => 'required|string|unique:vouchers,code',
            'discount_value' => 'required|numeric|min:0',
            'discount_type' => 'required|in:percent,fixed',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
        ]);

        $voucher = Voucher::create([
            'code' => $request->code,
            'discount_value' => $request->discount_value,
            'discount_type' => $request->discount_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'min_order_value' => $request->min_order_value,
            'max_discount_value' => $request->max_discount_value,
            'usage_limit' => $request->usage_limit,
            'created_by' => $user->id,
            'shop_id' => $user->shop->id,
        ]);

        return response()->json(['message' => 'Tạo voucher shop thành công', 'data' => $voucher], 201);
    }
    // 3. Lấy chi tiết một voucher theo ID
    public function show($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        return response()->json($voucher);
    }

    // 4. Cập nhật voucher
    public function update(Request $request, $id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        $request->validate([
            'code' => 'sometimes|string|unique:vouchers,code,' . $id,
            'discount_value' => 'sometimes|numeric|min:0',
            'discount_type' => 'sometimes|in:percent,fixed',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:0',
            'created_by' => 'nullable|exists:users,id',
        ]);

        $voucher->update($request->all());
        return response()->json(['message' => 'Cập nhật voucher thành công', 'data' => $voucher]);
    }

    // 5. Xoá voucher
    public function destroy($id)
    {
        $voucher = Voucher::find($id);

        if (!$voucher) {
            return response()->json(['message' => 'Không tìm thấy voucher'], 404);
        }

        $voucher->delete();
        return response()->json(['message' => 'Xoá voucher thành công']);
    }

    // 6. Kiểm tra và áp dụng mã giảm giá (đã có)
    public function apply(Request $request)
    {
 $validated = $request->validate([
        'code'    => 'required|string',
        'shop_id' => 'nullable|integer',       // 👈 NEW: cho phép chỉ định shop
        // (nếu bạn muốn: 'items' => 'nullable|array' để tính theo danh sách đã chọn)
    ]);

        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Bạn cần đăng nhập để áp dụng mã giảm giá'], 401);
        }

        // Lấy giỏ hàng của user
        $carts = Cart::query()
            ->select(['id', 'product_id', 'variant_id', 'quantity'])
            ->with('product')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Giỏ hàng trống'], 400);
        }
         $targetShopId = $validated['shop_id'] ?? null;
    if ($targetShopId !== null) {
        $carts = $carts->filter(fn($c) => (int)$c->product->shop_id === (int)$targetShopId);
        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Không có sản phẩm thuộc shop đã chọn'], 400);
        }
    }

        // Tìm voucher
        $voucher = Voucher::where('code', $request->code)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$voucher) {
            return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
        }

        if ($voucher->usage_limit && $voucher->usage_count >= $voucher->usage_limit) {
            return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
        }
        $shopIdsInCart = $carts->pluck('product.shop_id')->unique()->toArray();
        if ($voucher->shop_id !== null) {
            if (!in_array($voucher->shop_id, $shopIdsInCart)) {
                return response()->json(['message' => 'Mã giảm giá không áp dụng cho các sản phẩm trong giỏ hàng của bạn'], 400);
            }
        }
        // Kiểm tra user có được dùng voucher này không
        $userVoucherCount = DB::table('voucher_users')->where('voucher_id', $voucher->id)->count();
        if ($userVoucherCount > 0) {
            $userVoucherExists = DB::table('voucher_users')
                ->where('voucher_id', $voucher->id)
                ->where('user_id', $userId)
                ->exists();
            if (!$userVoucherExists) {
                return response()->json(['message' => 'Mã giảm giá không dành cho bạn'], 400);
            }
        }
        $hasUsedBefore = \App\Models\Order::where('user_id', $userId)
        ->where('voucher_id', $voucher->id)
        ->whereNull('deleted_at')                // nếu có soft delete
        ->whereNotIn('order_status', ['Canceled']) // không tính đơn đã hủy
        ->exists();

        if ($hasUsedBefore) {
        return response()->json(['message' => 'Bạn đã sử dụng voucher này rồi'], 400);
        }
        // Tính tổng tiền
        $subtotalAll = 0;
        foreach ($carts as $cart) {
            $subtotalAll += $cart->quantity * $cart->product->price;
        }

        // Kiểm tra category áp dụng
        $subtotalApplicable = $subtotalAll;
        $applicableCategoryIds = DB::table('voucher_categories')
            ->where('voucher_id', $voucher->id)
            ->pluck('category_id')
            ->toArray();

        $eligibleCarts = $carts->filter(function ($cart) use ($voucher, $applicableCategoryIds) {
            if (!is_null($voucher->shop_id) && $cart->product->shop_id != $voucher->shop_id) return false;
            if (!empty($applicableCategoryIds) && !in_array($cart->product->category_id, $applicableCategoryIds)) return false;
            return true;
        });
        $subtotalApplicable = $eligibleCarts->reduce(function ($s, $cart) {
            return $s + $cart->quantity * $cart->product->price;
        }, 0);

        if ($subtotalApplicable <= 0) {
            return response()->json(['message' => 'Không có sản phẩm phù hợp để áp dụng mã'], 400);
        }
        if ($subtotalApplicable < $voucher->min_order_value) {
            return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
        }

        if (count($applicableCategoryIds) > 0) {
            $subtotalApplicable = 0;
            foreach ($carts as $cart) {
                if (in_array($cart->product->category_id, $applicableCategoryIds)) {
                    $subtotalApplicable += $cart->quantity * $cart->product->price;
                }
            }
        }

        if ($subtotalApplicable < $voucher->min_order_value) {
            return response()->json(['message' => 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã'], 400);
        }

        // Tính số tiền giảm
        $discount = 0;
        if ($voucher->discount_value > 0) {
            if ($voucher->discount_type === 'percent') {
                $discount = min(
                    $voucher->discount_value / 100 * $subtotalApplicable,
                    $voucher->max_discount_value ?? $subtotalApplicable
                );
            } else {
                $discount = min($voucher->discount_value, $subtotalApplicable);
            }
        }

        return response()->json([
            'message' => 'Áp dụng mã giảm giá thành công',
            'voucher_id' => $voucher->id,
            'discount_amount' => round($discount),
            'is_free_shipping' => (bool) $voucher->is_free_shipping
        ]);
    }
    public function saveVoucherForUser(Request $request)
    {
        $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
        ]);

        $user = Auth::user();

        // Trường hợp chưa đăng nhập
        if (!$user) {
            return response()->json(['message' => 'Bạn cần đăng nhập để lưu voucher'], 401);
        }

        // Kiểm tra xem user đã lưu voucher chưa
        $exists = VoucherUser::where('voucher_id', $request->voucher_id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Bạn đã lưu voucher này trước đó'], 409);
        }

        // Tạo bản ghi mới
        $voucherUser = VoucherUser::create([
            'voucher_id' => $request->voucher_id,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lưu voucher thành công',
            'data' => $voucherUser,
        ]);
    }
}
