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
public function getRecentContacts(Request $request)
{
    $user = Auth::user();

    $messages = Message::with(['sender', 'receiver'])
        ->where(function ($query) use ($user) {
            $query->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
        })
        ->orderBy('created_at', 'desc')
        ->get();

    $contacts = [];

    foreach ($messages as $msg) {
        $otherUser = $msg->sender_id === $user->id ? $msg->receiver : $msg->sender;

        // Nếu đã có user này trong danh sách rồi thì bỏ qua
        if (collect($contacts)->contains('id', $otherUser->id)) {
            continue;
        }

        // Nếu là shop, lấy thêm thông tin shop
        $name = $otherUser->name;
        $avatar = $otherUser->avatar;

        if ($otherUser->role === 'seller') {
            $shop = \App\Models\Shop::where('user_id', $otherUser->id)->first();
            if ($shop) {
                $name = $shop->name ?? $otherUser->name;
                $avatar = $shop->logo ?? $otherUser->avatar;
            }
        }

        $contacts[] = [
            'id' => $otherUser->id,
            'name' => $name,
            'avatar' => $avatar,
            'role' => $otherUser->role,
            'last_message' => $msg->message ?? 'Hình ảnh',
            'last_time' => $msg->created_at->toDateTimeString(),
        ];
    }

    return response()->json(array_values($contacts));
}


    // POST /messages → Gửi tin nhắn mới
public function store(Request $request)
{
    $user = Auth::user();

    $validated = $request->validate([
        'receiver_id' => 'required|integer|exists:users,id',
        'message' => 'nullable|string',
        'image' => 'nullable|file|image|max:5120', // max 5MB
    ]);

    $imagePath = null;
    if ($request->hasFile('image')) {
        $imagePath = $request->file('image')->store('chat_images', 'public');
    }

    $message = Message::create([
        'sender_id' => $user->id,
        'receiver_id' => $validated['receiver_id'],
        'message' => $validated['message'] ?? null,
        'image' => $imagePath,
    ]);

    return $message->load(['sender', 'receiver']);
}


    // (Có thể có thêm hàm xóa hoặc đánh dấu đã đọc nếu cần)
}
