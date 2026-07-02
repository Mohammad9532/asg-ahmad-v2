<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'shop_access' => \App\Http\Middleware\CheckShopAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    return response()->json([
                        'message' => $e->getMessage() ?: 'Error',
                    ], $e->getStatusCode());
                }

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'message' => $e->getMessage(),
                        'errors' => $e->errors(),
                    ], $e->status);
                }

                if (!config('app.debug')) {
                    if ($e->getCode() >= 500 || $e->getCode() === 0) {
                        \App\Services\ActivityLogService::log("Critical Error: " . $e->getMessage(), "System");
                    }
                    
                    return response()->json([
                        'message' => 'An unexpected error occurred.',
                        'code' => 500,
                    ], 500);
                }
            }
        });
    })->create();
