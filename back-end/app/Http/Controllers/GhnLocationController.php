<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GhnLocationController extends Controller
{
    private $apiUrl;
    private $token;

    public function __construct()
    {
        $this->apiUrl = config('services.ghn.api_url');
        $this->token  = config('services.ghn.api_token');
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
