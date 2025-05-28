<?php

namespace App\Http\Controllers;

use App\Models\VoucherCategory;
use Illuminate\Http\Request;

class VoucherCategoryController extends Controller
{
    public function assignToCategory(Request $request)
    {
        $request->validate([
            'voucher_id' => 'required|exists:vouchers,id',
            'category_id' => 'required|exists:categories,id',
        ]);

        $exists = VoucherCategory::where('voucher_id', $request->voucher_id)
            ->where('category_id', $request->category_id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Voucher đã gán cho category này'], 400);
        }

        $vc = VoucherCategory::create([
            'voucher_id' => $request->voucher_id,
            'category_id' => $request->category_id,
        ]);

        return response()->json(['message' => 'Đã gán voucher cho danh mục', 'data' => $vc]);
    }
}
