<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Email hoặc mật khẩu không đúng'], 401);
        }

        if (is_null($user->email_verified_at)) {
            return response()->json(['error' => 'Tài khoản chưa được xác minh. Vui lòng kiểm tra email.'], 403);
        }

        try {
            $token = $user->createToken('web')->plainTextToken;
        } catch (\Exception $e) {
            return response()->json(['error' => 'Không thể tạo token.'], 500);
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 200);
    }

    public function index()
    {
        return response()->json(User::all());
    }

    public function show(string $id)
    {
        $user = User::find($id);
        return $user ? response()->json($user) : response()->json(['error' => 'User not found'], 404);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20|unique:users,phone',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'verify_token' => Str::random(100)
        ]);

        $userId = base64_encode($user->id);
        $url = url('/verify/' . $userId . '/' . urlencode($user->verify_token));

        try {
            Mail::send('emails.verify', ['user' => $user, 'url' => $url], function ($message) use ($user) {
                $message->to($user->email)->subject('Xác minh email của bạn');
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Không thể gửi email xác nhận: ' . $e->getMessage()], 500);
        }

        return response()->json(['message' => 'Đăng ký thành công! Kiểm tra email để xác nhận.', 'user' => $user], 201);
    }

    public function update(Request $request, string $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:100',
            'username' => 'sometimes|required|string|max:50|unique:users,username,' . $user->id,
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|required|string|max:20|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        $user->update(array_filter([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->filled('password') ? Hash::make($request->password) : null
        ]));

        return response()->json(['message' => 'User updated successfully!', 'user' => $user], 200);
    }

    public function destroy(string $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Người dùng không tồn tại.'], 404);
        }

        $user->delete();
        return response()->json(['message' => 'Người dùng đã được xóa thành công!'], 200);
    }

    public function showVerifyPrompt($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if (!$user) return view('emails.verify_result', ['message' => 'Người dùng không tồn tại.']);
        if ($user->email_verified_at !== null) return view('emails.verify_result', ['message' => 'Tài khoản của bạn đã được xác minh trước đó.']);
        if ($user->verify_token !== $token) return view('emails.verify_result', ['message' => 'Token không hợp lệ hoặc đã hết hạn.']);

        return view('emails.verify_prompt', [
            'user' => $user,
            'confirmUrl' => route('verify.confirm', ['userId' => $userId, 'token' => $token]),
            'rejectUrl' => route('verify.reject', ['userId' => $userId, 'token' => $token])
        ]);
    }

    public function confirm($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if ($user && $user->verify_token === $token) {
            $user->email_verified_at = now();
            $user->verify_token = null;
            $user->save();
            return view('emails.verify_result', ['message' => 'Xác minh thành công!']);
        }

        return view('emails.verify_result', ['message' => 'Token không hợp lệ.']);
    }

    public function reject($userId, $token)
    {
        $decodedUserId = (int) base64_decode($userId);
        $user = User::find($decodedUserId);

        if ($user && $user->verify_token === $token) {
            $user->verify_token = null;
            $user->save();
            return view('emails.verify_result', ['message' => 'Xác minh thất bại!']);
        }

        return view('emails.verify_result', ['message' => 'Token không hợp lệ.']);
    }
}
