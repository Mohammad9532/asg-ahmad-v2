<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
use App\Jobs\RunDatabaseBackupJob;
use App\Models\Notification;
use App\Models\ActivityLog;
use App\Services\BackupService;

// Daily Database Backup
Schedule::job(new RunDatabaseBackupJob)->dailyAt('02:00');

// Clean up expired notifications
Schedule::call(function () {
    Notification::where('expires_at', '<', now())->update(['is_archived' => true]);
})->daily();

// Clean up old backups based on retention policy
Schedule::call(function () {
    app(BackupService::class)->cleanup();
})->daily();

// Clean up very old activity logs (e.g., older than 6 months)
Schedule::call(function () {
    ActivityLog::where('created_at', '<', now()->subMonths(6))->delete();
})->weekly();

