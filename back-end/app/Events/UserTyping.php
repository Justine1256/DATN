<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $senderId;
    public $receiverId;
    public $isTyping;
    public $senderName;
    public $senderAvatar;

    public function __construct($senderId, $receiverId, $isTyping, $senderName, $senderAvatar = null)
    {
        $this->senderId = $senderId;
        $this->receiverId = $receiverId;
        $this->isTyping = $isTyping;
        $this->senderName = $senderName;
        $this->senderAvatar = $senderAvatar;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('chat.' . $this->receiverId);
    }

    public function broadcastAs()
    {
        return 'UserTyping';
    }

    public function broadcastWith()
    {
        return [
            'sender_id' => $this->senderId,
            'receiver_id' => $this->receiverId,
            'is_typing' => $this->isTyping,
            'sender_name' => $this->senderName,
            'sender_avatar' => $this->senderAvatar,
        ];
    }
}
