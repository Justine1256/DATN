<?php

namespace App\Http\Controllers;

use App\Models\VoucherUser;
use Illuminate\Http\Request;

class VoucherUserController extends Controller
{
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
}
