<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Queue;
use Illuminate\Queue\QueueManager;

class HealthController extends Controller
{
    /**
     * Basic health check (Lightweight).
     */
    public function health(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'degraded', 'message' => 'Database connection failed'], 503);
        }
    }

    /**
     * Detailed diagnostics (Super Admin only).
     */
    public function diagnostics(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole(['Super Admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $diagnostics = [
            'timestamp' => now()->toIso8601String(),
            'environment' => app()->environment(),
            'debug_mode' => config('app.debug'),
            'versions' => [
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
            ],
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'disk' => $this->checkDiskSpace(),
            'queue' => $this->checkQueue(),
            'warnings' => $this->getEnvironmentWarnings(),
        ];

        $status = empty($diagnostics['warnings']) && $diagnostics['database']['status'] === 'connected'
            ? 'ok'
            : 'degraded';

        $diagnostics['status'] = $status;

        return response()->json($diagnostics, $status === 'ok' ? 200 : 207);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'connected',
                'driver' => DB::connection()->getDriverName(),
                'database' => DB::connection()->getDatabaseName(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'disconnected',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkCache(): array
    {
        try {
            $driver = config('cache.default');
            Cache::store($driver)->put('health_check', 'ok', 10);
            $val = Cache::store($driver)->get('health_check');
            
            return [
                'status' => $val === 'ok' ? 'operational' : 'failed',
                'driver' => $driver,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkDiskSpace(): array
    {
        $path = storage_path();
        $free = disk_free_space($path);
        $total = disk_total_space($path);
        $usedPercent = $total > 0 ? (($total - $free) / $total) * 100 : 0;

        return [
            'free_bytes' => $free,
            'total_bytes' => $total,
            'used_percentage' => round($usedPercent, 2),
            'status' => $usedPercent > 90 ? 'warning' : 'ok',
        ];
    }

    private function checkQueue(): array
    {
        $connection = config('queue.default');
        try {
            $size = Queue::connection($connection)->size();
            return [
                'status' => 'operational',
                'connection' => $connection,
                'pending_jobs' => $size,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getEnvironmentWarnings(): array
    {
        $warnings = [];

        if (app()->environment('production') && config('app.debug') === true) {
            $warnings[] = 'APP_DEBUG is TRUE in production environment. This is a severe security risk.';
        }

        if (config('app.key') === 'SomeRandomString' || empty(config('app.key'))) {
            $warnings[] = 'APP_KEY is not securely generated.';
        }

        return $warnings;
    }
}
