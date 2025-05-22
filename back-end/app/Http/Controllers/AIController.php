<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
public function check(Request $request)
    {
        $content = $request->input('content');

        // Gọi GPT-3.5 Turbo
        $response = Http::withToken(env('OPENAI_API_KEY'))->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Bạn là bộ lọc tiếng Việt. Nếu văn bản có từ ngữ tục tĩu, phân biệt, khiêu dâm, lăng mạ thì trả lời: "vi phạm". Nếu không thì trả lời: "ok".',
                ],
                [
                    'role' => 'user',
                    'content' => $content,
                ],
            ],
            'temperature' => 0,
        ]);

        $data = $response->json();
        $answer = strtolower($data['choices'][0]['message']['content']);

        if (str_contains($answer, 'vi phạm')) {
            return response()->json(['status' => 'rejected', 'message' => 'Nội dung vi phạm.'], 400);
        }

        return response()->json(['status' => 'ok', 'message' => 'Nội dung hợp lệ.']);
    }

}

