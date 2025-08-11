<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Google\Client as GoogleClient;

class AuthController extends Controller
{
    /**
     * Handle Google OAuth signup
     */
    public function googleSignup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid request data',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Verify Google token
            $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->credential);

            if (!$payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid Google token'
                ], 400);
            }

            $googleId = $payload['sub'];
            $email = $payload['email'];
            $name = $payload['name'];
            $avatar = $payload['picture'] ?? null;

            // Check if user already exists
            $existingUser = User::where('email', $email)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email đã được sử dụng'
                ], 409);
            }

            // Lấy phần trước @ từ email
            $baseUsername = explode('@', $email)[0];
            $baseUsername = strtolower(preg_replace('/[^a-z0-9]/', '', $baseUsername)); // lọc ký tự lạ
            $username = $baseUsername;
            $counter = 1;

            // Nếu trùng thì thêm số phía sau
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
                }


            // Create user directly without requiring phone for Google signup
            $user = User::create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'phone' => '', // Empty phone for Google signup
                'avatar' => $avatar,
                'password' => Hash::make(Str::random(32)), // Random password for Google users
                'email_verified_at' => now(), // Google emails are pre-verified
                'role' => 'user',
                'rank' => 'member',
                'status' => 'activated',
                'report_violations' => 0,
                'is_report_blocked' => 0,
                'last_login' => now(),
            ]);

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công',
                'requires_phone' => false, // No phone required for Google signup
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'rank' => $user->rank,
                    'status' => $user->status,
                ],
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete Google OAuth signup with additional data
     */
    public function googleSignupComplete(Request $request)
    {
        // This method is no longer needed for Google signup but kept for compatibility
        $validator = Validator::make($request->all(), [
            'google_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string|max:100',
            'username' => 'required|string|max:50',
            'phone' => 'required|string|max:20',
            'avatar' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu không hợp lệ',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Double-check if user already exists
            $existingUser = User::where('email', $request->email)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email đã được sử dụng'
                ], 409);
            }

            // Check if username is taken
            if (User::where('username', $request->username)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username đã được sử dụng'
                ], 409);
            }

            // Create user
            $user = User::create([
                'name' => $request->name,
                'username' => $request->username,
                'email' => $request->email,
                'phone' => $request->phone,
                'avatar' => $request->avatar,
                'password' => Hash::make(Str::random(32)), // Random password for Google users
                'email_verified_at' => now(), // Google emails are pre-verified
                'role' => 'user',
                'rank' => 'member',
                'status' => 'activated',
                'report_violations' => 0,
                'is_report_blocked' => 0,
                'last_login' => now(),
            ]);

            // Create token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'rank' => $user->rank,
                    'status' => $user->status,
                ],
                'token' => $token
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
    public function googleLogin(Request $request)
{
    $validator = Validator::make($request->all(), [
        'credential' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid request data',
            'errors' => $validator->errors()
        ], 400);
    }

    try {
        // Verify Google token
        $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
        $payload = $client->verifyIdToken($request->credential);

        if (!$payload) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Google token'
            ], 400);
        }

        $email = $payload['email'];
        $googleId = $payload['sub'];
        $name = $payload['name'];
        $avatar = $payload['picture'] ?? null;

        // Tìm user theo email
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản Google chưa được đăng ký'
            ], 404);
        }

        // Kiểm tra trạng thái tài khoản
        if ($user->status !== 'activated') {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản của bạn hiện không hoạt động',
                'status'  => $user->status
            ], 403);
        }

        // Cập nhật avatar mới từ Google (nếu có)
        if ($avatar && $user->avatar !== $avatar) {
            $user->avatar = $avatar;
        }

        // Cập nhật last_login
        $user->last_login = now();
        $user->save();

        // Tạo token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'rank' => $user->rank,
                'status' => $user->status,
            ],
            'token' => $token
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Đăng nhập thất bại: ' . $e->getMessage()
        ], 500);
    }
}
}
