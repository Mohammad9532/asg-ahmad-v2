<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckShopAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = Auth::user();

        // If it's a creation request that submits a shop_id, ensure they are allowed to submit for that shop.
        if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('patch')) {
            $requestedShopId = $request->input('shop_id');
            
            // If they are submitting a shop_id and they are not global, verify it matches
            if ($requestedShopId && !$user->isGlobal()) {
                if ($user->shop_id != $requestedShopId) {
                    return response()->json(['message' => 'Forbidden. You can only create records for your assigned shop.'], 403);
                }
            }

            // Enforce shop_id if missing for non-global users
            if (!$requestedShopId && !$user->isGlobal()) {
                $request->merge(['shop_id' => $user->shop_id]);
            }
        }

        return $next($request);
    }
}
