<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Queue;

class QueueController extends Controller
{
    /**
     * Display queue status and failed jobs.
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole(['Super Admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $connection = config('queue.default');
        $pendingJobs = 0;
        
        try {
            $pendingJobs = Queue::connection($connection)->size();
        } catch (\Exception $e) {
            // Ignore if queue connection fails
        }

        $failedJobs = [];
        try {
            $failedJobs = DB::table('failed_jobs')->orderBy('failed_at', 'desc')->get();
        } catch (\Exception $e) {
            // Failed jobs table might not exist
        }

        return response()->json([
            'connection' => $connection,
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
        ]);
    }

    /**
     * Retry a specific failed job.
     */
    public function retry(Request $request, string $id): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasRole(['Super Admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            Artisan::call('queue:retry', ['id' => [$id]]);
            return response()->json(['message' => "Job {$id} has been queued for retry."]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to retry job: ' . $e->getMessage()], 500);
        }
    }
}
