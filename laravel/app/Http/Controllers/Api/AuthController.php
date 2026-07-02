<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Services\ActivityLogService;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Log login manually since Auth::user() isn't set for the stateless request yet
        Auth::login($user);
        ActivityLogService::log('Logged In', 'Auth');

        \App\Services\NotificationService::send(
            title: "New Login Detected",
            message: "A successful login to your account.",
            category: "SECURITY",
            type: "Login",
            priority: "Normal",
            icon: "security",
            userId: $user->id,
            expiresAt: now()->addDays(7)
        );

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('role', 'shop')
        ]);
    }

    public function logout(Request $request)
    {
        $user = clone $request->user();
        ActivityLogService::log('Logged Out', 'Auth');
        $request->user()->currentAccessToken()->delete();

        \App\Services\NotificationService::send(
            title: "Logged Out",
            message: "You have successfully logged out.",
            category: "SECURITY",
            type: "Logout",
            priority: "Normal",
            icon: "security",
            userId: $user->id,
            expiresAt: now()->addDays(7)
        );

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role', 'shop'));
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        ActivityLogService::log('Changed Password', 'Auth');

        \App\Services\NotificationService::send(
            title: "Password Changed",
            message: "Your account password was successfully updated.",
            category: "SECURITY",
            type: "Password Changed",
            priority: "High",
            icon: "security",
            userId: $user->id,
            expiresAt: now()->addDays(7)
        );

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
