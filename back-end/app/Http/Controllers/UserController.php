<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

use function Illuminate\Log\log;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string'
        ]);

        $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL)
            ? 'email'
            : (is_numeric($request->login) ? 'phone' : 'username');

        $user = User::where($loginField, $request->login)->first();

        if (!$user) {
            return response()->json(['message' => 'Tài khoản không tồn tại'], 404);
        }

        // ❌ Nếu không phải activated thì chặn luôn
        if ($user->status !== 'activated') {
            return response()->json([
                'message' => 'Tài khoản của bạn hiện không hoạt động',
                'status'  => $user->status
            ], 403);
        }

        if (!Auth::attempt([$loginField => $request->login, 'password' => $request->password])) {
            return response()->json(['message' => 'Thông tin đăng nhập không đúng'], 401);
        }

        $token = $user->createToken('api_token')->plainTextToken;
        $user->update(['last_login' => now()]);

        return response()->json([
            'message' => 'Đăng nhập thành công',
            'token'   => $token,
            'user'    => $user
        ]);
    }
    public function index()
    {
        return response()->json(User::all());
    }

    public function show()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Bạn chưa đăng nhập.'], 401);
        }

        return response()->json($user);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|alpha_dash|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => [
                'required',
                'regex:/^0\d{9}$/',
                'unique:users,phone',
            ],
            'password' => [
                'required',
                'string',
                'min:6',
                'max:255',
                'confirmed',
            ],
        ], [
            'name.required' => 'Vui lòng nhập họ và tên.',
            'name.string' => 'Họ và tên không hợp lệ.',
            'name.max' => 'Họ và tên không được vượt quá 255 ký tự.',

            'username.required' => 'Vui lòng nhập tên đăng nhập.',
            'username.string' => 'Tên đăng nhập không hợp lệ.',
            'username.max' => 'Tên đăng nhập không được vượt quá 50 ký tự.',
            'username.alpha_dash' => 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới.',
            'username.unique' => 'Tên đăng nhập đã được sử dụng.',

            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',
            'email.max' => 'Email không được vượt quá 255 ký tự.',
            'email.unique' => 'Email đã được sử dụng.',

            'phone.required' => 'Vui lòng nhập số điện thoại.',
            'phone.regex' => 'Số điện thoại không đúng định dạng. Phải bắt đầu bằng số 0 và có 10 chữ số.',
            'phone.unique' => 'Số điện thoại đã được sử dụng.',

            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.string' => 'Mật khẩu không hợp lệ.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'password.max' => 'Mật khẩu không được vượt quá 255 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
        ]);


        $otp = rand(100000, 999999);

        $cacheKey = "otp_register:{$request->email}";
        $cacheData = [
            'otp' => (string) $otp,
            'attempts' => 0,
            'data' => [
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
            ]
        ];

        // Ghi cache
        Cache::put($cacheKey, $cacheData, now()->addMinutes(5));

        // Ép cache "warm-up"
        Cache::get($cacheKey);

        // Gửi mail sau khi chắc chắn cache đã tồn tại
        Mail::raw("Mã OTP của bạn là: $otp", function ($message) use ($request) {
            $message->to($request->email)->subject('Xác minh OTP');
        });

        return response()->json(['message' => 'Mã OTP đã được gửi đến email.']);
    }


    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|numeric|digits:6',
        ]);

        $email = $request->email;
        $otpData = Cache::get("otp_register:$email");

        if (!$otpData) {
            return response()->json(['error' => 'OTP đã hết hạn hoặc không tồn tại.'], 400);
        }

        if ($otpData['attempts'] >= 5) {
            return response()->json(['error' => 'Bạn đã nhập sai quá số lần cho phép.'], 429);
        }

        if ($otpData['otp'] !== $request->otp) {
            $otpData['attempts'] += 1;
            Cache::put("otp_register:$email", $otpData, now()->addMinutes(5));
            return response()->json(['error' => 'OTP không chính xác.'], 400);
        }

        $data = $otpData['data'];

        User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => $data['password'],
            'email_verified_at' => now(),
            'status' => 'activated',
        ]);
        // hiện ra thời gian tạo tài khoản
        $user = User::where('email', $data['email'])->first();
        if (!$user) {
            return response()->json(['error' => 'Không tìm thấy người dùng.'], 404);
        }
        Cache::forget("otp_register:$email");

        return response()->json(['message' => 'Xác minh OTP thành công. Tài khoản đã được tạo.']);
    }

    public function showAllUsers(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);

        $users = DB::table('users')
            ->leftJoin('orders', 'users.id', '=', 'orders.user_id')
            ->leftJoin('shops', 'users.id', '=', 'shops.user_id')
            ->leftJoin(DB::raw('(
            SELECT shop_id, COUNT(id) as totalReports,
                   GROUP_CONCAT(DISTINCT reason ORDER BY created_at DESC SEPARATOR " | ") as reportReasons,
                   GROUP_CONCAT(DISTINCT created_at ORDER BY created_at DESC SEPARATOR " | ") as reportDates
            FROM reports
            GROUP BY shop_id
        ) as report_data'), 'users.id', '=', 'report_data.shop_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.avatar',
                'users.role',
                'users.status as original_status',
                'users.created_at as registration_date',
                'shops.logo as shop_logo',
                DB::raw('COUNT(DISTINCT orders.id) as totalOrders'),
                DB::raw("IFNULL(SUM(CASE WHEN orders.order_status = 'Delivered' AND orders.payment_status = 'Completed' THEN orders.final_amount ELSE 0 END), 0) as totalSpent"),
                // ✅ Chỉ tính đơn bị hủy bởi Customer
                DB::raw("SUM(CASE WHEN orders.order_status = 'Canceled' AND orders.canceled_by = 'Customer' THEN 1 ELSE 0 END) as canceledOrders"),
                DB::raw('IFNULL(report_data.totalReports, 0) as totalReports'),
                DB::raw('report_data.reportReasons'),
                DB::raw('report_data.reportDates')
            )
            ->whereNotIn('users.role', ['admin', 'seller'])
            ->groupBy('users.id', 'users.name', 'users.email', 'users.phone', 'users.avatar', 'users.role', 'users.status', 'users.created_at', 'shops.logo', 'report_data.totalReports', 'report_data.reportReasons', 'report_data.reportDates')
            ->paginate($perPage, ['*'], 'page', $page);

        $users->getCollection()->transform(function ($u) {
            $statusMap = [
                'activated' => 'active',
                'locked' => 'blocked',
                'deactivated' => 'inactive',
                'hidden' => 'hidden'
            ];

            // ✅ Cảnh báo chỉ dựa vào đơn hàng bị hủy bởi Customer
            $cancelLevel = 'normal';
            $cancelColor = 'green';
            if ($u->canceledOrders >= 10) {
                $cancelLevel = 'danger';
                $cancelColor = 'red';
            } elseif ($u->canceledOrders >= 5) {
                $cancelLevel = 'warning';
                $cancelColor = 'yellow';
            }

            return [
                'id' => 'USR' . str_pad($u->id, 3, '0', STR_PAD_LEFT),
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'role' => $u->role,
                'status' => $statusMap[$u->original_status] ?? 'unknown',
                'registrationDate' => date('Y-m-d', strtotime($u->registration_date)),
                'totalOrders' => (int)$u->totalOrders,
                'totalSpent' => (float)$u->totalSpent,
                'canceledOrders' => (int)$u->canceledOrders, // ✅ Chỉ đơn bị hủy bởi Customer
                'cancelStatus' => [
                    'level' => $cancelLevel,
                    'color' => $cancelColor
                ],
                'avatar' => $u->avatar,
                'reports' => [
                    'total' => (int)$u->totalReports,
                    'reasons' => $u->reportReasons ? explode(' | ', $u->reportReasons) : [],
                    'dates' => $u->reportDates ? explode(' | ', $u->reportDates) : [],
                ]
            ];
        });

        return response()->json([
            'status' => true,
            'message' => 'Danh sách người dùng',
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ]
        ]);
    }

    public function update(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $rules = [
            'name' => 'sometimes|string|max:255|unique:users,name,' . $user->id,
            'email' => 'sometimes|nullable|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|string|min:9|max:15|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:6',
        ];

        if ($request->has('email') || $request->has('password')) {
            $rules['current_password'] = 'required|string';
        }

        $validated = $request->validate($rules, [
            'name.unique' => 'Tên tài khoản này đã tồn tại.',
            'email.unique' => 'Email này đã tồn tại.',
            'phone.unique' => 'Số điện thoại này đã được sử dụng.',
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi.',
        ]);


        $changingEmail = $request->filled('email');
        $changingPassword = $request->filled('password');

        if ($changingEmail || $changingPassword) {
            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json(['error' => 'Mật khẩu hiện tại không đúng.'], 403);
            }
        }

        if ($request->filled('email')) {
            $user->email = $request->input('email');
        }

        if ($request->filled('name')) {
            $user->name = $request->input('name');
        }

        if ($request->filled('phone')) {
            $user->phone = $request->input('phone');
        }

        if ($changingPassword) {
            if (!$request->filled('password_confirmation')) {
                return response()->json(['error' => 'Vui lòng nhập lại mật khẩu xác nhận.'], 422);
            }

            if ($request->input('password') !== $request->input('password_confirmation')) {
                return response()->json(['error' => 'Mật khẩu xác nhận không khớp.'], 422);
            }

            $user->password = Hash::make($request->input('password'));
        }

        $user->save();

        return response()->json([
            'message' => 'Cập nhật thành công!',
            'user' => $user
        ]);
    }
    public function sendResetOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'Email này không tồn tại trong hệ thống.',
        ]);

        $otp = rand(100000, 999999);

        $user = User::where('email', $request->email)->first();
        $user->verify_token = $otp;
        $user->save();

        try {
            Mail::raw("Mã OTP đặt lại mật khẩu của bạn là: $otp", function ($message) use ($user) {
                $message->to($user->email)->subject('Đặt lại mật khẩu - OTP');
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Không thể gửi email: ' . $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Mã OTP đã được gửi tới email của bạn.']);
    }

    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6',
            'password' => 'required|string|min:6|confirmed', // sử dụng password_confirmation
        ], [
            'otp.required' => 'Vui lòng nhập mã OTP.',
            'password.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        $user = User::where('email', $request->email)
            ->where('verify_token', $request->otp)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Mã OTP không chính xác hoặc đã hết hạn.'], 400);
        }

        $user->password = Hash::make($request->password);
        $user->verify_token = null; // xóa mã OTP sau khi đặt lại mật khẩu
        $user->save();

        return response()->json(['message' => 'Mật khẩu đã được đặt lại thành công!']);
    }
    public function verifyOtpOnly(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp' => 'required|numeric|digits:6',
        ]);

        $user = User::where('email', $request->email)
            ->where('verify_token', $request->otp)
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Mã OTP không chính xác hoặc đã hết hạn.'], 400);
        }

        return response()->json(['message' => 'Mã OTP chính xác.']);
    }

    public function updateAvatar(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'avatar.required' => 'Bạn chưa tải ảnh lên.',
            'avatar.image' => 'Ảnh đại diện phải là định dạng hình ảnh.',
            'avatar.max' => 'Kích thước ảnh tối đa là 2MB.',
        ]);


        // Xoá ảnh cũ nếu có
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Lưu ảnh mới
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        return response()->json([
            'message' => 'Cập nhật ảnh đại diện thành công!',
            'avatar_url' => asset('storage/' . $path),
            'profilePicture' => $user->avatar,
            'user' => $user
        ]);
    }

    public function destroy(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Xác thực mật khẩu
        $request->validate([
            'password' => 'required|string',
        ], [
            'password.required' => 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.',
        ]);

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json(['error' => 'Mật khẩu không chính xác.'], 403);
        }
        $user->delete();

        return response()->json(['message' => 'Tài khoản đã được xóa thành công.'], 200);
    }

    public function showVerifyPrompt($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if (!$user) return view('emails.verify_result', ['message' => 'Người dùng không tồn tại.']);
        if ($user->email_verified_at !== null) return view('emails.verify_result', ['message' => 'Tài khoản của bạn đã được xác minh trước đó.']);
        if ($user->verify_token !== $token) return view('emails.verify_result', ['message' => 'Token không hợp lệ hoặc đã hết hạn.']);

        return view('emails.verify_prompt', [
            'user' => $user,
            'confirmUrl' => route('verify.confirm', ['userId' => $userId, 'token' => $token]),
            'rejectUrl' => route('verify.reject', ['userId' => $userId, 'token' => $token])
        ]);
    }

    public function confirm($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if ($user && $user->verify_token === $token) {
            $user->email_verified_at = now();
            $user->verify_token = null;
            $user->save();
            return view('emails.verify_result', ['message' => 'Xác minh thành công!']);
        }

        return view('emails.verify_result', ['message' => 'Token không hợp lệ.']);
    }

    public function reject($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if ($user && $user->verify_token === $token) {
            $user->verify_token = null;
            $user->save();
            return view('emails.verify_result', ['message' => 'Xác minh thất bại!']);
        }

        return view('emails.verify_result', ['message' => 'Token không hợp lệ.']);
    }

    public function getStatistics()
    {
        // Tổng quan
        $totalUsers        = DB::table('users')->where('role', 'user')->count();
        $totalShops        = DB::table('shops')->count();
        $totalProducts     = DB::table('products')->count();
        $totalOrders       = DB::table('orders')->count();
        $totalRevenue      = DB::table('orders')->where('payment_status', 'Completed')->sum('final_amount');
        $totalCommission   = DB::table('commissions')->where('status', 'Paid')->sum('amount');
        $totalVouchers     = DB::table('vouchers')->count();
        $totalCategories   = DB::table('categories')->count();
        $totalParentCategories = DB::table('categories')->whereNull('parent_id')->count();

        // User bị cảnh báo (dựa trên số đơn bị hủy)
        $userCancelStats = DB::table('orders')
            ->select('user_id', DB::raw('COUNT(*) as cancel_count'))
            ->where('order_status', 'Canceled')
            ->groupBy('user_id')
            ->get();

        $warningUsers = $userCancelStats->where('cancel_count', '>=', 5)->where('cancel_count', '<', 10)->count();
        $dangerUsers  = $userCancelStats->where('cancel_count', '>=', 10)->count();

        // Shop bị cảnh báo (dựa trên số lần bị report)
        $shopReportStats = DB::table('reports')
            ->select('shop_id', DB::raw('COUNT(*) as report_count'))
            ->groupBy('shop_id')
            ->get();

        $warningShops = $shopReportStats->where('report_count', '>=', 5)->where('report_count', '<', 10)->count();
        $dangerShops  = $shopReportStats->where('report_count', '>=', 10)->count();

        return response()->json([
            'total_users'            => $totalUsers,
            'total_shops'            => $totalShops,
            'total_products'         => $totalProducts,
            'total_orders'           => $totalOrders,
            'total_revenue'          => $totalRevenue,
            'total_commission'       => $totalCommission,
            'total_vouchers'         => $totalVouchers,
            'total_categories'       => $totalCategories,
            'total_parent_categories' => $totalParentCategories,
            'warning_users'          => $warningUsers,
            'danger_users'           => $dangerUsers,
            'warning_shops'          => $warningShops,
            'danger_shops'           => $dangerShops,
        ]);
    }
    public function recalculateMyRank(Request $request)
    {
        // Lấy user từ token (đã qua middleware auth)
        $user = $request->user(); // hoặc Auth::user()
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $id = $user->id;

        // Tổng chi của các đơn hợp lệ
        $total = DB::table('orders')
            ->where('user_id', $id)
            ->where('order_status', 'Delivered')
            ->whereIn('return_status', ['None', 'Rejected'])
            ->whereNull('deleted_at')
            ->sum(DB::raw('COALESCE(final_amount, total_amount)'));

        // Suy ra rank
        $rank = match (true) {
            $total >= 50_000_000 => 'diamond',
            $total >= 20_000_000 => 'gold',
            $total >= 10_000_000 => 'silver',
            $total >= 5_000_000  => 'bronze',
            default               => 'member',
        };

        // Chỉ update nếu khác để tránh ghi DB không cần thiết
        $current = DB::table('users')->where('id', $id)->value('rank');
        $updated = false;

        if ($current !== $rank) {
            DB::table('users')->where('id', $id)->update([
                'rank'       => $rank,
                'updated_at' => now(),
            ]);
            $updated = true;
        }

        return response()->json([
            'user_id'     => $id,
            'total_spent' => (float) $total,
            'rank'        => $rank,
            'updated'     => $updated,
        ]);
    }
}
