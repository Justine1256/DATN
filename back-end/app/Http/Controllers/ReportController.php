<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    // Lấy danh sách tất cả báo cáo (chỉ nên dùng cho admin)
    public function index()
    {
        return response()->json(Report::with(['user', 'shop'])->latest()->get());
    }

    // Tạo mới một báo cáo
    public function store(Request $request)
    {
        $request->validate([
            'shop_id' => 'required|exists:shops,id',
            'reason' => 'required|string|max:1000',
        ]);

        $report = Report::create([
            'user_id' => Auth::id(),
            'shop_id' => $request->shop_id,
            'reason' => $request->reason,
        ]);

        return response()->json($report, 201);
    }

    // Xem chi tiết một báo cáo
    public function show($id)
    {
        $report = Report::with(['user', 'shop'])->findOrFail($id);
        return response()->json($report);
    }

    // Cập nhật trạng thái báo cáo (chỉ admin nên được phép)
    public function update(Request $request, $id)
    {
        $report = Report::findOrFail($id);

        $request->validate([
            'status' => 'required|in:Pending,Resolved',
        ]);

        $report->status = $request->status;
        $report->save();

        return response()->json($report);
    }

    // Xoá báo cáo (tuỳ chọn)
    public function destroy($id)
    {
        $report = Report::findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'Report deleted']);
    }
    public function reportRefundToAdmin(Request $request, $orderId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
            'images' => 'required|array|min:1',
            'images.*' => 'url',
        ]);

        $order = \App\Models\Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        // ❌ Đơn chưa bị từ chối hoàn → không cho tố cáo
        if ($order->return_status !== 'Rejected' || $order->order_status !== 'Return Rejected') {
            return response()->json(['message' => 'Chỉ khi đơn hoàn bị từ chối mới được khiếu nại'], 400);
        }

        // ❌ Đã có tố cáo rồi → không cho gửi tiếp
        $exists = \App\Models\Report::where('order_id', $order->id)->exists();
        if ($exists) {
            return response()->json(['message' => 'Đơn hàng này đã được tố cáo rồi'], 400);
        }
        $user = Auth::user();
        if ($user->is_report_blocked) {
            return response()->json(['message' => 'Bạn đã bị cấm gửi tố cáo do vi phạm nhiều lần'], 403);
        }

        // ✅ Tạo báo cáo tố cáo lên admin
        $report = \App\Models\Report::create([
            'user_id' => Auth::id(),
            'shop_id' => $order->shop_id,
            'order_id' => $order->id,
            'reason' => $validated['reason'],
            'status' => 'Pending',
        ]);

        foreach ($validated['images'] as $url) {
            \App\Models\OrderReturnPhoto::create([
                'order_id' => $order->id,
                'image_path' => $url,
            ]);
        }

        return response()->json(['message' => 'Tố cáo đơn hàng #' . $order->id . ' đã được gửi thành công', 'report_id' => $report->id]);
    }
}
