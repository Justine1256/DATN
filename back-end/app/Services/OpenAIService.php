<?php

// app/Services/OpenAIService.php
namespace App\Services;

use OpenAI;

class OpenAIService
{
    protected $client;
    public function __construct()
    {
        $apiKey = config('services.openai.key');
        $this->client = OpenAI::client($apiKey);
    }

    public function chat($message, $context = [])
    {
        // Đưa context (nếu có) vào trước user để LLM “nhìn” context rồi mới thấy câu hỏi
        $messages = array_merge(
            [[
                'role' => 'system',
                'content' =>
                    "Bạn là chatbot hỗ trợ khách hàng cho sàn thương mại Marketo. " .
                    "Quy tắc:\n" .
                    "1) Nếu người dùng chỉ chào hỏi (vd: 'chào', 'hello', 'hi') hoặc chưa nêu nhu cầu cụ thể, " .
                    "   hãy chào lại thân thiện, HỎI người dùng đang tìm sản phẩm gì/budget/thương hiệu/yêu cầu, " .
                    "   và KHÔNG đề xuất sản phẩm nào.\n" .
                    "2) Khi người dùng mô tả nhu cầu rõ ràng (loại sản phẩm, tiêu chí, ngân sách...), " .
                    "   mới gợi ý sản phẩm từ context (nếu có) + giải thích ngắn gọn.\n" .
                    "3) Giữ câu trả lời ngắn gọn, tiếng Việt, thân thiện."
            ]],
            $context, // context có thể là list sản phẩm đã lọc/embedding
            [['role' => 'user', 'content' => $message]],
        );

        $result = $this->client->chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
        ]);

        return $result->choices[0]->message->content ?? '';
    }

    public function embedding($text)
    {
        $result = $this->client->embeddings()->create([
            'model' => 'text-embedding-3-small',
            'input' => $text,
        ]);

        return $result->embeddings[0]->embedding;
    }
}

