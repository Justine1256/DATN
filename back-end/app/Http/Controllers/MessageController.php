<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    // GET /messages?user_id=2 → Lấy tất cả tin nhắn giữa người dùng hiện tại và người có id = 2
    public function index(Request $request)
    {
        $user = Auth::user();
        $otherUserId = $request->query('user_id');

        if (!$otherUserId) {
            return response()->json(['message' => 'Missing user_id'], 400);
        }

        $messages = Message::with(['sender:id,name,email,avatar', 'receiver:id,name,email,avatar']) // Optional fields
            ->where(function ($query) use ($user, $otherUserId) {
                $query->where('sender_id', $user->id)->where('receiver_id', $otherUserId);
            })
            ->orWhere(function ($query) use ($user, $otherUserId) {
                $query->where('sender_id', $otherUserId)->where('receiver_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    // POST /messages → Gửi tin nhắn mới
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
            'message' => 'nullable|string',
            'image' => 'nullable|string',
        ]);

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $validated['receiver_id'],
            'message' => $validated['message'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);

        // Load lại sender/receiver để trả về dữ liệu đầy đủ
        $message->load('sender:id,name,email,avatar', 'receiver:id,name,email,avatar');

        return response()->json($message, 201);
    }

    // (Có thể có thêm hàm xóa hoặc đánh dấu đã đọc nếu cần)
}
