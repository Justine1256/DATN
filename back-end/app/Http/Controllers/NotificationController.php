<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // GET /notification → Lấy thông báo của user + chung
    public function index()
    {
        $userId = Auth::id();

        $notifications = Notification::where(function ($query) use ($userId) {
                $query->whereNull('user_id')
                      ->orWhere('user_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    // GET /notification/{id} → Đánh dấu đã đọc + trả chi tiết
    public function show($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $userId = Auth::id();

        // Nếu không phải của mình và không phải chung → cấm xem
        if ($notification->user_id !== null && $notification->user_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Đánh dấu đã đọc
        $notification->is_read = 1;
        $notification->save();

        return response()->json($notification);
    }

    // POST /notification → Thêm mới thông báo (dành cho admin)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image_url' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $notification = Notification::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'image_url' => $validated['image_url'] ?? null,
            'link' => $validated['link'] ?? null,
            'user_id' => $validated['user_id'] ?? null,
            'is_read' => 0,
        ]);

        return response()->json([
            'message' => 'Notification created successfully',
            'data' => $notification
        ], 201);
    }

    // DELETE /notification/{id} → Xoá mềm
    public function destroy($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully']);
    }
}
