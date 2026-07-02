<?php

namespace App\Services;

use App\Models\BackupHistory;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use ZipArchive;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BackupService
{
    private string $storagePath = 'backups/database';

    public function __construct()
    {
        if (!Storage::disk('local')->exists($this->storagePath)) {
            Storage::disk('local')->makeDirectory($this->storagePath);
        }
    }

    /**
     * Run the database backup, zip it, and verify integrity.
     */
    public function createBackup(): BackupHistory
    {
        $startTime = microtime(true);
        $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
        $sqlFilename = "backup_{$timestamp}.sql";
        $zipFilename = "backup_{$timestamp}.zip";

        $sqlPath = storage_path("app/{$this->storagePath}/{$sqlFilename}");
        $zipPath = storage_path("app/{$this->storagePath}/{$zipFilename}");

        $history = BackupHistory::create([
            'filename' => $zipFilename,
            'status' => 'Processing',
        ]);

        try {
            // 1. Dump Database
            $this->dumpDatabase($sqlPath);

            // 2. Compress to ZIP
            $this->compressBackup($sqlPath, $zipPath, $sqlFilename);

            // 3. Delete uncompressed SQL file
            if (file_exists($sqlPath)) {
                unlink($sqlPath);
            }

            // 4. Verify Integrity
            $this->verifyIntegrity($zipPath, $sqlFilename);

            // Success
            $history->update([
                'status' => 'Success',
                'size_bytes' => filesize($zipPath),
                'execution_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);

            NotificationService::send(
                title: "Backup Completed",
                message: "Database backup completed successfully.",
                category: "BACKUP",
                type: "Backup Completed",
                priority: "Normal",
                icon: "backup",
                expiresAt: now()->addDays(30)
            );

            return $history;

        } catch (\Exception $e) {
            Log::error("Backup failed: " . $e->getMessage());

            if (file_exists($sqlPath)) unlink($sqlPath);
            if (file_exists($zipPath)) unlink($zipPath);

            $history->update([
                'status' => 'Failed',
                'error_message' => $e->getMessage(),
                'execution_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);

            NotificationService::send(
                title: "Backup Failed",
                message: "Database backup failed. Please check logs.",
                category: "BACKUP",
                type: "Backup Failed",
                priority: "Critical",
                icon: "backup"
            );

            throw $e;
        }
    }

    private function dumpDatabase(string $sqlPath): void
    {
        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $command = sprintf(
            'mysqldump --host="%s" --port="%s" --user="%s" --password="%s" "%s" > "%s"',
            $dbHost, $dbPort, $dbUser, $dbPass, $dbName, $sqlPath
        );

        // Windows uses cmd, Linux uses bash. We'll use Process::fromShellCommandline
        $process = Process::fromShellCommandline($command);
        $process->setTimeout(300); // 5 minutes
        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }

    private function compressBackup(string $sqlPath, string $zipPath, string $sqlFilename): void
    {
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \Exception("Cannot create zip archive at {$zipPath}");
        }

        $zip->addFile($sqlPath, $sqlFilename);
        $zip->close();
    }

    private function verifyIntegrity(string $zipPath, string $sqlFilename): void
    {
        if (!file_exists($zipPath)) {
            throw new \Exception("Verification failed: Zip file does not exist.");
        }

        if (filesize($zipPath) === 0) {
            throw new \Exception("Verification failed: Zip file size is 0 bytes.");
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \Exception("Verification failed: Could not open zip archive.");
        }

        if ($zip->locateName($sqlFilename) === false) {
            $zip->close();
            throw new \Exception("Verification failed: SQL payload missing from zip archive.");
        }

        $zip->close();
    }

    /**
     * Restore database from backup zip
     */
    public function restoreDatabase(BackupHistory $history): void
    {
        $zipPath = storage_path("app/{$this->storagePath}/{$history->filename}");
        
        if (!file_exists($zipPath)) {
            throw new \Exception("Backup file not found on disk.");
        }

        $sqlFilename = str_replace('.zip', '.sql', $history->filename);
        $sqlPath = storage_path("app/{$this->storagePath}/{$sqlFilename}");

        $zip = new ZipArchive();
        if ($zip->open($zipPath) === true) {
            $zip->extractTo(storage_path("app/{$this->storagePath}"), [$sqlFilename]);
            $zip->close();
        } else {
            throw new \Exception("Could not extract backup for restore.");
        }

        $dbHost = config('database.connections.mysql.host');
        $dbPort = config('database.connections.mysql.port');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $command = sprintf(
            'mysql --host="%s" --port="%s" --user="%s" --password="%s" "%s" < "%s"',
            $dbHost, $dbPort, $dbUser, $dbPass, $dbName, $sqlPath
        );

        $process = Process::fromShellCommandline($command);
        $process->setTimeout(600);
        $process->run();

        if (file_exists($sqlPath)) {
            unlink($sqlPath);
        }

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }

    /**
     * Cleanup old backups based on retention policy
     */
    public function cleanup(): void
    {
        $retentionDays = (int) setting('backup_retention_days', 30);
        
        $oldBackups = BackupHistory::where('created_at', '<', now()->subDays($retentionDays))
            ->get();

        foreach ($oldBackups as $backup) {
            $path = "{$this->storagePath}/{$backup->filename}";
            if (Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
            }
            $backup->delete();
        }
    }
}
