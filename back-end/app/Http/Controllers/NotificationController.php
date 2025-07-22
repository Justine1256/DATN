<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationController extends Controller
{
    // GET /notification → Lấy toàn bộ thông báo
    public function index()
    {
        return response()->json(Notification::orderBy('created_at', 'desc')->get());
    }

    // GET /notification/{id} → Lấy chi tiết 1 thông báo
    public function show($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        return response()->json($notification);
    }
public function markAsRead($id)
{
    $notification = Notification::find($id);
    if (!$notification) {
        return response()->json(['message' => 'Notification not found'], 404);
    }

    if ($notification->is_read == 1) {
        return response()->json(['message' => 'Already read'], 200);
    }

    $notification->is_read = 1;
    $notification->save();

    return response()->json(['message' => 'Notification marked as read'], 200);
}
    // POST /notification → Thêm mới thông báo
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image_url' => 'nullable|string|max:255',
            'link' => 'nullable|string|max:255',
        ]);

        $notification = Notification::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'image_url' => $validated['image_url'] ?? null,
            'link' => $validated['link'] ?? null,
            'is_read' => 0,
        ]);

        return response()->json(['message' => 'Notification created successfully', 'data' => $notification], 201);
    }

    // DELETE /notification/{id} → Xoá mềm (soft delete)
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
