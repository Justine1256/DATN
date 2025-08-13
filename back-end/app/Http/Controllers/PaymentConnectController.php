<?php

namespace App\Http\Controllers;

use App\Models\ShopPaymentAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PaymentConnectController extends Controller
{
    // Tạo URL ủy quyền và trả về cho FE redirect
    public function connect(Request $request, string $provider)
    {
        $request->validate([
            'shop_id' => 'required|exists:shops,id',
        ]);

        // sinh state chống CSRF
        $state = Str::random(40);
        $cacheKey = "oauth_state:{$provider}:{$state}";
        Cache::put($cacheKey, [
            'user_id' => $request->user()->id ?? null,
            'shop_id' => (int) $request->shop_id,
            'provider' => $provider,
        ], now()->addMinutes(10));

        $redirectUri = route('payment.callback', ['provider' => $provider]);

        // build authorization URL theo provider
        $authUrl = $this->buildAuthUrl($provider, $redirectUri, $state);

        return response()->json([
            'url' => $authUrl
        ]);
    }

    // Callback nhận code từ đối tác -> đổi token -> lưu DB -> redirect về FE
    public function callback(Request $request, string $provider)
    {
        // map tên route
        // trong routes/api.php chưa đặt name, ta đặt name ở api.php hoặc build bằng route() như dưới
        // thêm name cho route bên dưới code routes
        // (xem mục routes chỉnh lại tên)

        $state = $request->query('state');
        $code  = $request->query('code');

        if (!$state || !$code) {
            return response()->json(['message' => 'Missing state or code'], 422);
        }

        $cacheKey = "oauth_state:{$provider}:{$state}";
        $cached = Cache::pull($cacheKey); // pull để dùng 1 lần
        if (!$cached) {
            return response()->json(['message' => 'Invalid or expired state'], 400);
        }

        $redirectUri = route('payment.callback', ['provider' => $provider]);

        // Đổi code lấy token từ đối tác
        $tokenResp = $this->exchangeToken($provider, $code, $redirectUri);

        if (!$tokenResp['ok']) {
            // quay về FE báo lỗi
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL'));
            $fail = "{$frontendUrl}/payment/failed?provider={$provider}&reason=token_exchange_failed";
            return redirect()->away($fail);
        }

        // Lấy data token + merchant info
        $config = [
            'access_token'  => $tokenResp['data']['access_token'] ?? null,
            'refresh_token' => $tokenResp['data']['refresh_token'] ?? null,
            'expires_in'    => $tokenResp['data']['expires_in'] ?? null,
            'merchant_info' => $tokenResp['data']['merchant_info'] ?? null,
            // Lưu thêm bất kỳ thông tin nào bạn cần
        ];

        // Lưu/Update tài khoản thanh toán theo shop_id + provider (gateway)
        $account = ShopPaymentAccount::updateOrCreate(
            [
                'shop_id' => $cached['shop_id'],
                'gateway' => $provider,
            ],
            [
                'config' => $config,
                'status' => 'active',
            ]
        );

        // Redirect về FE hiển thị thành công
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL'));
        $success = "{$frontendUrl}/payment/success?provider={$provider}";
        return redirect()->away($success);
    }

    private function buildAuthUrl(string $provider, string $redirectUri, string $state): string
    {
        if ($provider === 'vnpay') {
            $clientId = env('VNPAY_CLIENT_ID');
            $authUrl  = env('VNPAY_AUTH_URL');
            // tuỳ đối tác, query có thể khác
            return $authUrl . '?' . http_build_query([
                'response_type' => 'code',
                'client_id'     => $clientId,
                'redirect_uri'  => $redirectUri,
                'scope'         => 'basic',
                'state'         => $state,
            ]);
        }

        if ($provider === 'momo') {
            $clientId = env('MOMO_CLIENT_ID');
            $authUrl  = env('MOMO_AUTH_URL');
            return $authUrl . '?' . http_build_query([
                'response_type' => 'code',
                'client_id'     => $clientId,
                'redirect_uri'  => $redirectUri,
                'scope'         => 'basic',
                'state'         => $state,
            ]);
        }

        abort(404, 'Provider not supported');
    }

    private function exchangeToken(string $provider, string $code, string $redirectUri): array
    {
        try {
            if ($provider === 'vnpay') {
                $tokenUrl    = env('VNPAY_TOKEN_URL');
                $clientId    = env('VNPAY_CLIENT_ID');
                $clientSecret= env('VNPAY_CLIENT_SECRET');

                $resp = Http::asForm()->post($tokenUrl, [
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'redirect_uri'  => $redirectUri,
                    'client_id'     => $clientId,
                    'client_secret' => $clientSecret,
                ]);

                if ($resp->failed()) {
                    return ['ok' => false, 'data' => $resp->json()];
                }

                // Giả sử bên đối tác trả merchant_info kèm token
                return ['ok' => true, 'data' => $resp->json()];
            }

            if ($provider === 'momo') {
                $tokenUrl    = env('MOMO_TOKEN_URL');
                $clientId    = env('MOMO_CLIENT_ID');
                $clientSecret= env('MOMO_CLIENT_SECRET');

                $resp = Http::asForm()->post($tokenUrl, [
                    'grant_type'    => 'authorization_code',
                    'code'          => $code,
                    'redirect_uri'  => $redirectUri,
                    'client_id'     => $clientId,
                    'client_secret' => $clientSecret,
                ]);

                if ($resp->failed()) {
                    return ['ok' => false, 'data' => $resp->json()];
                }
                return ['ok' => true, 'data' => $resp->json()];
            }
        } catch (\Throwable $e) {
            report($e);
            return ['ok' => false, 'data' => ['exception' => $e->getMessage()]];
        }

        return ['ok' => false, 'data' => ['error' => 'Provider not supported']];
    }
}
