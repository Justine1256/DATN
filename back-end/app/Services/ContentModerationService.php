<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ContentModerationService
{
public function check($content): bool
{
    // Blacklist thủ công (nếu muốn)
    $blacklist = ['cc', 'đcm', 'đm', 'đéo'];
    foreach ($blacklist as $badWord) {
        if (stripos($content, $badWord) !== false) {
            return false;
        }
    }

    $response = Http::withToken(env('OPENAI_API_KEY'))->post('https://api.openai.com/v1/chat/completions', [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'Bạn là bộ lọc tiếng Việt giúp phát hiện các từ ngữ tục tĩu hoặc nội dung không phù hợp. Nếu phát hiện, trả lời "vi phạm", còn không thì trả lời "ok". Cố gắng tránh chặn nhầm các bình luận hợp lệ.',
                // gắt 'content' => 'Bạn là bộ lọc tiếng Việt. Nếu văn bản có từ ngữ tục tĩu, phân biệt, khiêu dâm, lăng mạ thì trả lời: "vi phạm". Nếu không thì trả lời: "ok".',
                // cực gắt 'content' => 'Bạn là bộ lọc tiếng Việt rất nghiêm ngặt. Nếu văn bản có bất kỳ từ ngữ tục tĩu, chửi thề, phân biệt chủng tộc, khiêu dâm, lăng mạ, xúc phạm, thô tục, hoặc bất kỳ nội dung không phù hợp nào, hãy trả lời chính xác: "vi phạm". Nếu không có thì trả lời: "ok". Không được bỏ sót bất kỳ trường hợp nào.',
            ],
            [
                'role' => 'user',
                'content' => $content,
            ],
        ],
        'temperature' => 0,
    ]);

    $data = $response->json();
    $answer = strtolower($data['choices'][0]['message']['content'] ?? '');

    return !str_contains($answer, 'vi phạm');
}

}
