<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    // Lấy tin nhắn giữa user hiện tại và một user khác (chat 1-1)
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'limit' => 'integer|min:1|max:100',
            'offset' => 'integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $userId = Auth::id();
        $otherUserId = $request->user_id;

        // Lấy tin nhắn giữa 2 user, sắp xếp mới nhất trước
        $limit = $request->limit ?? 20;
        $offset = $request->offset ?? 0;

        $messages = Message::where(function($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $userId)
                  ->where('receiver_id', $otherUserId);
            })
            ->orWhere(function($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $otherUserId)
                  ->where('receiver_id', $userId);
            })
            ->orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        return response()->json($messages, 200);
    }

    // Gửi tin nhắn mới
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id|different:' . Auth::id(),
            'message' => 'nullable|string|max:1000',
            'image' => 'nullable|string|max:255', // hoặc validate hình ảnh nếu upload file
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (empty($request->message) && empty($request->image)) {
            return response()->json(['errors' => ['message' => ['Message or image is required']]], 422);
        }

        $message = Message::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message,
            'image' => $request->image,
            'status' => 'show',
        ]);

        return response()->json($message, 201);
    }

    // Ẩn tin nhắn (set status = hidden)
    public function hide($id)
    {
        $message = Message::where('id', $id)
            ->where('sender_id', Auth::id()) // chỉ người gửi được ẩn
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message not found or permission denied'], 404);
        }

        $message->status = 'hidden';
        $message->save();

        return response()->json(['message' => 'Message hidden'], 200);
    }

    // Xoá tin nhắn (xoá mềm)
    public function destroy($id)
    {
        $message = Message::where('id', $id)
            ->where('sender_id', Auth::id()) // chỉ người gửi mới được xoá
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message not found or permission denied'], 404);
        }

        $message->delete();

        return response()->json(['message' => 'Message deleted'], 200);
    }
}
