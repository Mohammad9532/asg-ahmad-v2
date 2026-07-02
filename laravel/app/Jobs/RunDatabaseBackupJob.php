<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\BackupService;
use Illuminate\Support\Facades\Log;

class RunDatabaseBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 600; // 10 minutes

    /**
     * Execute the job.
     */
    public function handle(BackupService $backupService): void
    {
        try {
            $backupService->createBackup();
        } catch (\Exception $e) {
            Log::error("Scheduled Backup Failed: " . $e->getMessage());
            // Failure is tracked internally inside BackupService
        }
    }
}
