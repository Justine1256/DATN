<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
        Log::info('MessageSent event created', [
            'message_id' => $message->id,
            'sender_id' => $message->sender_id,
            'receiver_id' => $message->receiver_id
        ]);
    }

    public function broadcastOn()
    {
        $channels = [
            new PrivateChannel('chat.' . $this->message->sender_id),
            new PrivateChannel('chat.' . $this->message->receiver_id),
        ];

        Log::info('Broadcasting on channels', [
            'channels' => array_map(fn($ch) => $ch->name, $channels)
        ]);

        return $channels;
    }

    public function broadcastAs()
    {
        return 'MessageSent';
    }

    public function broadcastWith()
    {
        $data = [
            'id' => $this->message->id,
            'sender_id' => $this->message->sender_id,
            'receiver_id' => $this->message->receiver_id,
            'message' => $this->message->message,
            'image' => $this->message->image,
            'status' => $this->message->status,
            'created_at' => $this->message->created_at,
            'sender' => $this->message->sender,
            'receiver' => $this->message->receiver,
        ];

        Log::info('Broadcasting message data', $data);
        return $data;
    }

    public function broadcastQueue()
    {
        return null; // Broadcast ngay lập tức, không dùng queue
    }
}
