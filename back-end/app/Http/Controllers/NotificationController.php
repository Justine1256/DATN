<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Danh sách tất cả thông báo
    public function index()
    {
        return response()->json(Notification::latest()->get());
    }

    // Tạo mới một thông báo
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $notification = Notification::create([
            'content' => $request->content,
        ]);

        return response()->json($notification, 201);
    }

    // Xem chi tiết thông báo
    public function show($id)
    {
        $notification = Notification::findOrFail($id);
        return response()->json($notification);
    }


    // Xóa mềm thông báo
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }
}
