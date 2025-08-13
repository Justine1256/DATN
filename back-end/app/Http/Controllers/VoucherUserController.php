<?php

namespace App\Http\Controllers;

use App\Models\VoucherUser;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\Auth;

class VoucherUserController extends Controller
{
    public function index()
    {
        $data = VoucherUser::with(['voucher', 'user'])->get();
        return response()->json(['data' => $data]);
    }

    public function showByVoucherId($voucher_id)
    {
        $data = VoucherUser::with('user')
            ->where('voucher_id', $voucher_id)
            ->get();

        return response()->json(['data' => $data]);
    }
    public function showByUserId($user_id)
    {
        $data = VoucherUser::with('voucher')
            ->where('user_id', $user_id)
            ->get();

        return response()->json(['data' => $data]);
    }
    public function assignToRank(Request $request)
    {
        $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
            'rank' => 'required|in:member,bronze,silver,gold,diamond',
        ]);

        $users = User::where('rank', $request->rank)->get();

        $count = 0;

        foreach ($users as $user) {
            $exists = VoucherUser::where('voucher_id', $request->voucher_id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$exists) {
                VoucherUser::create([
                    'voucher_id' => $request->voucher_id,
                    'user_id' => $user->id,
                ]);
                $count++;
            }
        }

        return response()->json([
            'message' => "Đã gán voucher cho {$count} user có rank '{$request->rank}'",
        ]);
    }
    public function assignToUser(Request $request)
    {
        $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
            'user_id' => 'required|exists:users,id',
        ]);

        $exists = VoucherUser::where('voucher_id', $request->voucher_id)
            ->where('user_id', $request->user_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'User đã có voucher này'], 400);
        }

        $voucherUser = VoucherUser::create([
            'voucher_id' => $request->voucher_id,
            'user_id' => $request->user_id,
        ]);

        return response()->json(['message' => 'Đã gán voucher cho user', 'data' => $voucherUser]);
    }
    public function isVoucherSaved(Request $request)
    {
        $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Bạn cần đăng nhập'], 401);
        }

        $exists = VoucherUser::where('voucher_id', $request->voucher_id)
            ->where('user_id', $user->id)
            ->exists();

        return response()->json(['saved' => $exists]);
    }
    public function showMySavedVouchers(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json(['message' => 'Bạn cần đăng nhập'], 401);
    }

    $shopId      = $request->query('shop_id');            // ví dụ: /my-vouchers?shop_id=1
    $onlyActive  = filter_var($request->query('only_active'), FILTER_VALIDATE_BOOLEAN); // ?only_active=1
    $now         = now();

    $vouchers = Voucher::query()
        ->select('vouchers.*')
        ->join('voucher_users as vu', 'vu.voucher_id', '=', 'vouchers.id')
        ->where('vu.user_id', $user->id)
        ->when($shopId !== null, fn($q) => $q->where('vouchers.shop_id', $shopId))
        ->when($onlyActive, fn($q) => $q->whereDate('vouchers.start_date', '<=', $now)
                                        ->whereDate('vouchers.end_date', '>=', $now))
        ->distinct() // <- Mỗi voucher 1 dòng
        ->orderByDesc('vouchers.created_at')
        ->get();

    return response()->json(['data' => $vouchers]);
}

}
