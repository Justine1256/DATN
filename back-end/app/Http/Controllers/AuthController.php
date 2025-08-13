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
     * Handle Google OAuth login
     */
public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string',
            'username' => 'required|string',
            'picture' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid request data',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->credential);

            if (!$payload) {
                return response()->json([
                    'message' => 'Invalid Google token'
                ], 400);
            }

            $email = $request->email;

            // Check if user exists
            $user = User::where('email', $email)->first();
            if (!$user) {
                return response()->json(['message' => 'Tài khoản không tồn tại'], 404);
            }

            if ($user->status !== 'activated') {
                return response()->json([
                    'message' => 'Tài khoản của bạn hiện không hoạt động',
                    'status'  => $user->status
                ], 403);
            }

            $token = $user->createToken('api_token')->plainTextToken;
            $user->update(['last_login' => now()]);

            return response()->json([
                'message' => 'Đăng nhập thành công',
                'token'   => $token,
                'user'    => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Đăng nhập thất bại: ' . $e->getMessage()
            ], 500);
        }
    }
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
                'message' => 'Invalid request data',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Verify Google ID token
            $client = new GoogleClient(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->credential);

            if (!$payload) {
                return response()->json([
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
                    'message' => 'Email đã được sử dụng'
                ], 409);
            }

            // Generate unique username from email
            $baseUsername = explode('@', $email)[0];
            $baseUsername = strtolower(preg_replace('/[^a-z0-9]/', '', $baseUsername));
            $username = $baseUsername;
            $counter = 1;

            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }

            $user = User::create([
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'phone' => null,
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

            $token = $user->createToken('api_token')->plainTextToken;

            return response()->json([
                'message' => 'Đăng ký thành công',
                'token' => $token,
                'user' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Đăng ký thất bại: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete Google OAuth signup with additional data
     */
    public function googleSignupComplete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'google_id' => 'required|string',
            'email' => 'required|email',
            'name' => 'required|string|max:100',
            'username' => 'required|string|max:50',
            'phone' => 'nullable|string|max:20',
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
                'phone' => null,
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

            $token = $user->createToken('api_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng ký thành công',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'phone' => null,
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
}
