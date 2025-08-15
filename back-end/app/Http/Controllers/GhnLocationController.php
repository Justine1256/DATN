<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GhnLocationController extends Controller
{
    private $apiUrl = 'https://online-gateway.ghn.vn/shiip/public-api';
    private $token;

    public function __construct()
    {
        $this->token = env('GHN_API_TOKEN'); // Lấy từ .env
    }

    public function provinces()
    {
        $response = Http::withHeaders([
            'Token' => $this->token
        ])->get($this->apiUrl . '/master-data/province');

        return $response->json();
    }

    public function districts(Request $request)
    {
        $request->validate([
            'province_id' => 'required|integer'
        ]);

        $response = Http::withHeaders([
            'Token' => $this->token
        ])->get($this->apiUrl . '/master-data/district', [
            'province_id' => $request->province_id
        ]);

        return $response->json();
    }

    public function wards(Request $request)
    {
        $request->validate([
            'district_id' => 'required|integer'
        ]);

        $response = Http::withHeaders([
            'Token' => $this->token
        ])->get($this->apiUrl . '/master-data/ward', [
            'district_id' => $request->district_id
        ]);

        return $response->json();
    }
}
