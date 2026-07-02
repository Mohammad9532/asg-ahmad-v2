# ASG ERP V2 - Deployment Guide

## 1. Server Requirements
- PHP 8.2+
- MariaDB 10.4+ or MySQL 8.0+
- Web Server (Nginx / Apache)
- Composer

## 2. Installation Steps
1. Clone the repository.
2. Run `composer install --optimize-autoloader --no-dev`.
3. Copy `.env.example` to `.env` and configure database credentials.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate --seed --force`. (Seeder generates default settings and Super Admin account).

## 3. Queue Configuration
The application uses the `database` queue driver for Phase 1.
1. Ensure `.env` contains `QUEUE_CONNECTION=database`.
2. Start the queue worker using Supervisor (preferred) or PM2:
   ```bash
   php artisan queue:work --sleep=3 --tries=3
   ```

## 4. Task Scheduling (Cron)
Laravel's scheduler manages database backups, expired notification cleanup, and log rotation.
Add the following to the server's crontab (e.g., `crontab -e`):
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## 5. Directory Permissions
Ensure the web server (e.g., `www-data`) has read/write access to:
- `storage/`
- `bootstrap/cache/`
- `storage/app/backups/` (Crucial for automated backups)
