<?php
namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->load(['sender', 'receiver']); // rất quan trọng để frontend có đủ data
    }

    public function broadcastOn()
{
    $user1 = min($this->message->sender_id, $this->message->receiver_id);
    $user2 = max($this->message->sender_id, $this->message->receiver_id);

    return new PrivateChannel("private-chat.{$user1}.{$user2}");
}


    public function broadcastAs()
{
    return 'message.sent';
}

}

