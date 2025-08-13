<?php

namespace App\Http\Controllers;

use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    // GET /messages?user_id=2&page=1&limit=50 → Lấy tin nhắn giữa 2 user với pagination
    public function index(Request $request)
    {
        $user = Auth::user();
        $otherUserId = $request->query('user_id');
        $page = $request->query('page', 1);
        $limit = min($request->query('limit', 50), 100); // Max 100 messages per request

        if (!$otherUserId) {
            return response()->json(['message' => 'Missing user_id'], 400);
        }

        $messages = Message::with(['sender:id,name,email,avatar', 'receiver:id,name,email,avatar'])
            ->where(function ($query) use ($user, $otherUserId) {
                $query->where('sender_id', $user->id)->where('receiver_id', $otherUserId);
            })
            ->orWhere(function ($query) use ($user, $otherUserId) {
                $query->where('sender_id', $otherUserId)->where('receiver_id', $user->id);
            })
            ->where('status', 'show') // Chỉ lấy tin nhắn chưa bị ẩn
            ->orderBy('created_at', 'desc')
            ->paginate($limit, ['*'], 'page', $page);

        $messages->getCollection()->transform(function ($message) {
            return $message;
        });

        return response()->json([
            'data' => array_reverse($messages->items()),
            'current_page' => $messages->currentPage(),
            'last_page' => $messages->lastPage(),
            'total' => $messages->total(),
            'has_more' => $messages->hasMorePages()
        ]);
    }

    // GET /recent-contacts → Lấy danh sách người liên hệ gần đây (tối ưu query)
    public function getRecentContacts(Request $request)
    {
        $user = Auth::user();

        $latestMessages = DB::table('messages as m1')
            ->select('m1.*')
            ->join(DB::raw('(
                SELECT
                    CASE
                        WHEN sender_id = ' . $user->id . ' THEN receiver_id
                        ELSE sender_id
                    END as other_user_id,
                    MAX(created_at) as latest_time
                FROM messages
                WHERE (sender_id = ' . $user->id . ' OR receiver_id = ' . $user->id . ')
                    AND status = "show"
                GROUP BY other_user_id
            ) as latest'), function($join) {
                $join->on('m1.created_at', '=', 'latest.latest_time')
                     ->on(DB::raw('CASE WHEN m1.sender_id = ' . Auth::id() . ' THEN m1.receiver_id ELSE m1.sender_id END'), '=', 'latest.other_user_id');
            })
            ->where(function($query) use ($user) {
                $query->where('m1.sender_id', $user->id)
                      ->orWhere('m1.receiver_id', $user->id);
            })
            ->where('m1.status', 'show')
            ->orderBy('m1.created_at', 'desc')
            ->get();

        $contacts = [];

        foreach ($latestMessages as $msg) {
            $otherUserId = $msg->sender_id === $user->id ? $msg->receiver_id : $msg->sender_id;

            // Lấy thông tin user
            $otherUser = \App\Models\User::find($otherUserId);
            if (!$otherUser) continue;

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
                'last_time' => $msg->created_at,
                'is_sender' => $msg->sender_id === $user->id, // Thêm info ai là người gửi
            ];
        }

        return response()->json($contacts);
    }

    // POST /messages → Gửi tin nhắn mới với real-time broadcasting
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
            'message' => 'nullable|string|max:1000',
            'image' => 'nullable|file|image|max:5120', // max 5MB
        ]);

        if ($validated['receiver_id'] == $user->id) {
            return response()->json(['message' => 'Cannot send message to yourself'], 400);
        }

        if (empty($validated['message']) && !$request->hasFile('image')) {
            return response()->json(['message' => 'Message or image is required'], 400);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('chat_images', 'public');
        }

        $message = Message::create([
            'sender_id' => $user->id,
            'receiver_id' => $validated['receiver_id'],
            'message' => $validated['message'] ?? null,
            'image' => $imagePath,
            'status' => 'show'
        ]);

        $messageWithRelations = $message->load(['sender:id,name,email,avatar', 'receiver:id,name,email,avatar']);

        try {
            Log::info('Attempting to broadcast message', [
                'message_id' => $messageWithRelations->id,
                'broadcast_driver' => config('broadcasting.default')
            ]);

            event(new MessageSent($messageWithRelations));

            Log::info('Message broadcast event dispatched successfully');
        } catch (\Exception $e) {
            Log::error('Failed to broadcast message', [
                'error' => $e->getMessage(),
                'message_id' => $messageWithRelations->id
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => $messageWithRelations
        ]);
    }

    // PATCH /messages/{id}/hide → Ẩn tin nhắn
    public function hide(Request $request, $id)
    {
        $user = Auth::user();

        $message = Message::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message not found'], 404);
        }

        $message->update(['status' => 'hidden']);

        return response()->json(['success' => true]);
    }

    // DELETE /messages/{id} → Xóa mềm tin nhắn
    public function destroy(Request $request, $id)
    {
        $user = Auth::user();

        $message = Message::where('id', $id)
            ->where('sender_id', $user->id) // Chỉ người gửi mới được xóa
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message not found or unauthorized'], 404);
        }

        $message->delete(); // Soft delete

        return response()->json(['success' => true]);
    }

    // POST /typing → Gửi trạng thái đang gõ
    public function typing(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
            'is_typing' => 'required|boolean'
        ]);

        if ($validated['receiver_id'] == $user->id) {
            return response()->json(['message' => 'Cannot send typing to yourself'], 400);
        }

        event(new UserTyping(
            $user->id,
            $validated['receiver_id'],
            $validated['is_typing'],
            $user->name,
            $user->avatar
        ));

        return response()->json(['success' => true]);
    }

    public function markAsRead(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'sender_id' => 'required|integer|exists:users,id',
        ]);

        // Đánh dấu tất cả tin nhắn từ sender_id đến user hiện tại là đã đọc
        Message::where('sender_id', $validated['sender_id'])
            ->where('receiver_id', $user->id)
            ->where('status', 'show')
            ->update(['read_at' => now()]); // Cần thêm column read_at vào bảng

        return response()->json(['success' => true]);
    }
}
