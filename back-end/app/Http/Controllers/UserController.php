<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

use function Illuminate\Log\log;

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

    public function index(){
        return response()->json(User::all());
    }

public function show()
{
    /** @var \App\Models\User $user */
    $user = Auth::user();

    if (!$user) {
        return response()->json(['error' => 'Bạn chưa đăng nhập.'], 401);
    }

    return response()->json($user);
}

public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:100',
        'email' => 'required|email|unique:users,email',
        'phone' => 'required|string|max:20|unique:users,phone',
        'username' => 'required|string|max:50|unique:users,username',
        'password' => 'required|string|min:6',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    $otp = rand(100000, 999999);

    $user = User::create([
        'name' => $request->name,
        'username' => $request->username,
        'email' => $request->email,
        'phone' => $request->phone,
        'password' => Hash::make($request->password),
        'verify_token' => $otp,
        'status' => 'deactivated',
    ]);

    // Gửi OTP qua email
    try {
        Mail::raw("Mã xác minh OTP của bạn là: $otp", function ($message) use ($user) {
            $message->to($user->email)->subject('Xác minh OTP');
        });
    } catch (\Exception $e) {
        return response()->json(['error' => 'Không thể gửi email: ' . $e->getMessage()], 500);
    }

    return response()->json(['message' => 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP.']);
}

public function verifyOtp(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email',
        'otp' => 'required|numeric|digits:6',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 400);
    }

    $user = User::where('email', $request->email)
                ->where('verify_token', $request->otp)
                ->first();

    if (!$user) {
        return response()->json(['error' => 'Mã OTP không chính xác.'], 400);
    }

    $user->status = 'activated';
    $user->verify_token = null; // Xoá OTP sau khi xác minh
    $user->email_verified_at = now();
    $user->save();

    return response()->json(['message' => 'Xác minh OTP thành công! Tài khoản đã được kích hoạt.']);
}


public function update(Request $request)
{
    /** @var \App\Models\User $user */
    $user = Auth::user();

    $validated = $request->validate([
        'name' => 'sometimes|string|max:255|unique:users,name,' . $user->id,
        'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
        'phone' => 'sometimes|string|min:9|max:15|unique:users,phone,' . $user->id,
        'password' => 'nullable|string|min:6',
        'current_password' => 'required_with:email,password|string',
    ], [
        'name.unique' => 'Tên tài khoản này đã tồn tại.',
        'email.unique' => 'Email này đã tồn tại.',
        'phone.unique' => 'Số điện thoại này đã được sử dụng.',
        'current_password.required_with' => 'Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi.',
    ]);

    $changingEmail = $request->filled('email');
    $changingPassword = $request->filled('password');

    if ($changingEmail || $changingPassword) {
        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['error' => 'Mật khẩu hiện tại không đúng.'], 403);
        }
    }

    if ($request->filled('email')) {
        $user->email = $request->input('email');
    }

    if ($request->filled('name')) {
        $user->name = $request->input('name');
    }

    if ($request->filled('phone')) {
        $user->phone = $request->input('phone');
    }

    if ($changingPassword) {
        if (!$request->filled('password_confirmation')) {
            return response()->json(['error' => 'Vui lòng nhập lại mật khẩu xác nhận.'], 422);
        }

        if ($request->input('password') !== $request->input('password_confirmation')) {
            return response()->json(['error' => 'Mật khẩu xác nhận không khớp.'], 422);
        }

        $user->password = Hash::make($request->input('password'));
    }

    $user->save();

    return response()->json([
        'message' => 'Cập nhật thành công!',
        'user' => $user
    ]);
}


public function destroy(Request $request)
{
    /** @var \App\Models\User $user */
    $user = Auth::user();

    // Xác thực mật khẩu
    $request->validate([
        'password' => 'required|string',
    ], [
        'password.required' => 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.',
    ]);

    if (!Hash::check($request->input('password'), $user->password)) {
        return response()->json(['error' => 'Mật khẩu không chính xác.'], 403);
    }
    $user->delete();

    return response()->json(['message' => 'Tài khoản đã được xóa thành công.'], 200);
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
