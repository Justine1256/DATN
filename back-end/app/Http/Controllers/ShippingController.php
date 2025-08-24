<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ShippingController extends Controller
{
    public function calculateFee(Request $request)
    {
        $token = config('services.ghtk.token');
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Missing GHTK_TOKEN in .env'
            ], 500);
        }

        // Nếu FE không gửi dữ liệu, dùng data mặc định để debug
        $data = $request->all() ?: [
            "pick_province" => "Hà Nội",
            "pick_district" => "Quận Hai Bà Trưng",
            "province"      => "Hà Nội",
            "district"      => "Quận Hoàng Mai",
            "address"       => "123 Đường Giải Phóng",
            "weight"        => 1000,    // gram
            "value"         => 300000,  // VND
            "transport"     => "road"
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Token'        => $token,
            ])->post('https://services.giaohangtietkiem.vn/services/shipment/fee', $data);

            return response()->json([
                'success' => $response->successful(),
                'status'  => $response->status(),
                'data'    => $response->json(),
            ], $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
