<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupHistory;
use App\Services\BackupService;
use App\Jobs\RunDatabaseBackupJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class BackupController extends Controller
{
    private BackupService $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    public function index(Request $request): JsonResponse
    {
        // Require Super Admin or Owner
        if (!$request->user()->hasRole(['Super Admin', 'Owner'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $backups = BackupHistory::with('creator')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json($backups);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin', 'Owner'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Trigger asynchronously via queue
        RunDatabaseBackupJob::dispatch();

        return response()->json(['message' => 'Backup requested and is processing in the background.']);
    }

    public function requestRestore(Request $request, BackupHistory $backup): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin'])) {
            return response()->json(['message' => 'Only Super Admins can restore backups.'], 403);
        }

        if ($backup->status !== 'Success') {
            return response()->json(['message' => 'Cannot restore a failed backup.'], 400);
        }

        $token = Str::random(40);
        $backup->update([
            'restore_token' => hash('sha256', $token),
            'restore_token_expires_at' => now()->addMinutes(15),
        ]);

        return response()->json([
            'message' => 'Restore token generated. It will expire in 15 minutes.',
            'restore_token' => $token,
        ]);
    }

    public function restore(Request $request, BackupHistory $backup): JsonResponse
    {
        if (!$request->user()->hasRole(['Super Admin'])) {
            return response()->json(['message' => 'Only Super Admins can restore backups.'], 403);
        }

        $request->validate([
            'restore_token' => 'required|string',
        ]);

        if (
            !$backup->restore_token || 
            !$backup->restore_token_expires_at || 
            $backup->restore_token_expires_at->isPast() ||
            hash('sha256', $request->restore_token) !== $backup->restore_token
        ) {
            return response()->json(['message' => 'Invalid or expired restore token.'], 400);
        }

        // Token matched, proceed with restore
        try {
            $this->backupService->restoreDatabase($backup);

            // Invalidate token
            $backup->update([
                'restore_token' => null,
                'restore_token_expires_at' => null,
            ]);

            \App\Services\ActivityLogService::log("Restored Backup {$backup->filename}", "System");

            return response()->json(['message' => 'Database restored successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Restore failed: ' . $e->getMessage()], 500);
        }
    }
}
