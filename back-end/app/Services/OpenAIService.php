<?php

namespace App\Services;

use OpenAI;

class OpenAIService
{
    protected $client;

    public function __construct()
    {
        $this->client = OpenAI::client(env('OPENAI_API_KEY'));
    }

    // Chat bot
    public function chat($message, $context = [])
    {
        $messages = array_merge([
            ['role' => 'system', 'content' => 'Bạn là chatbot hỗ trợ khách hàng cho sàn thương mại Marketo.'],
            ['role' => 'user', 'content' => $message],
        ], $context);

        $result = $this->client->chat()->create([
            'model' => 'gpt-4o-mini', // nhanh & rẻ
            'messages' => $messages,
        ]);

        return $result->choices[0]->message->content ?? '';
    }

    // Tạo embeddings cho tìm kiếm sản phẩm
public function embedding($text)
    {
        $result = $this->client->embeddings()->create([
            'model' => 'text-embedding-3-small',
            'input' => $text,
        ]);

        return $result['data'][0]['embedding'];

    }

}
