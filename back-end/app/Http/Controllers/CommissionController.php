<?php

namespace App\Http\Controllers;

use App\Models\Commission;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommissionController extends Controller
{
    // Lấy danh sách hoa hồng (có thể phân trang)
    public function index(Request $request)
    {
        $commissions = Commission::with(['shop', 'order'])
            ->orderBy('commission_date', 'desc')
            ->paginate(20);

        return response()->json($commissions);
    }

    // Tính hoa hồng cho 1 đơn hàng dựa trên sản phẩm và lưu vào bảng commissions
    public function calculateAndStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'shop_id' => 'required|exists:shops,id',
            'order_id' => 'required|exists:orders,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $shopId = $request->shop_id;
        $orderId = $request->order_id;

        // Lấy tất cả sản phẩm trong đơn hàng
        $orderItems = Order::where('id', $orderId)->with('products')->get();

        if ($orderItems->isEmpty()) {
            return response()->json(['message' => 'No products found in this order'], 404);
        }

        // Tính tổng hoa hồng
        $totalCommission = 0;
        foreach ($orderItems as $item) {
            // Giả sử product có trường commission_rate (decimal 0-1)
            $commissionRate = 0.5;
            $totalCommission += $commissionRate * ($item->price * $item->quantity);
        }

        // Lưu hoa hồng vào database
        $commission = Commission::updateOrCreate(
            ['shop_id' => $shopId, 'order_id' => $orderId],
            [
                'amount' => $totalCommission,
                'commission_date' => now(),
                'status' => 'Pending',
            ]
        );

        return response()->json($commission, 201);
    }

    // Cập nhật trạng thái hoa hồng (ví dụ: từ Pending sang Paid)
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:Pending,Paid',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $commission = Commission::find($id);
        if (!$commission) {
            return response()->json(['message' => 'Commission not found'], 404);
        }

        $commission->status = $request->status;
        $commission->save();

        return response()->json($commission, 200);
    }
}
