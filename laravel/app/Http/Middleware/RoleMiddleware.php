<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::user();

        if (!$user->isActive()) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // Super Admin always has access to everything
        if ($user->hasRole('Super Admin')) {
            return $next($request);
        }

        if (!$user->hasRole($roles)) {
            return response()->json(['message' => 'Forbidden. You do not have the required role.'], 403);
        }

        return $next($request);
    }
}
