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
}
