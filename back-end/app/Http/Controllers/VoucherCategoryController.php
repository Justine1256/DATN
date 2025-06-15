<?php

namespace App\Http\Controllers;

use App\Models\VoucherCategory;
use Illuminate\Http\Request;

class VoucherCategoryController extends Controller
{
    public function index()
    {
        $data = VoucherCategory::with(['voucher', 'category'])->get();

        return response()->json(['data' => $data]);
    }
    public function showByVoucherId($voucher_id)
    {
        $data = VoucherCategory::with('category')
            ->where('voucher_id', $voucher_id)
            ->get();

        return response()->json(['data' => $data]);
    }

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
