<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;

use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\LedgerController;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\SettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::middleware('throttle:login')->post('/auth/login', [AuthController::class, 'login']);
Route::middleware('throttle:password_reset')->post('/auth/forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::middleware('throttle:password_reset')->post('/auth/reset-password', [PasswordResetController::class, 'resetPassword']);

// Public Health
Route::get('/system/health', [App\Http\Controllers\Api\HealthController::class, 'health']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Profile
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Settings Module
    Route::apiResource('settings', SettingsController::class);

    // Lookups
    Route::get('/lookups', [App\Http\Controllers\Api\LookupController::class, 'index']);

    // Master CRUD Modules
    Route::middleware('role:Super Admin,Owner')->group(function () {
        Route::apiResource('shops', App\Http\Controllers\Api\ShopController::class);
        Route::apiResource('departments', App\Http\Controllers\Api\DepartmentController::class);
        Route::apiResource('expense-categories', App\Http\Controllers\Api\ExpenseCategoryController::class);
        Route::apiResource('expense-masters', App\Http\Controllers\Api\ExpenseMasterController::class);
        Route::apiResource('employees', App\Http\Controllers\Api\EmployeeController::class);
        Route::apiResource('payment-methods', App\Http\Controllers\Api\PaymentMethodController::class);
        
        // Admin Modules
        Route::apiResource('users', App\Http\Controllers\Api\UserController::class);
        Route::apiResource('roles', App\Http\Controllers\Api\RoleController::class)->only(['index', 'show']);
    });

    // Notification Module
    Route::prefix('notifications')->group(function () {
        Route::get('/unread', [App\Http\Controllers\Api\NotificationController::class, 'unread']);
        Route::get('/count', [App\Http\Controllers\Api\NotificationController::class, 'count']);
        Route::post('/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
        Route::post('/{notification}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::post('/{notification}/archive', [App\Http\Controllers\Api\NotificationController::class, 'archive']);
        Route::get('/', [App\Http\Controllers\Api\NotificationController::class, 'index']);
    });

    // Reports Module
    Route::prefix('reports')->middleware('throttle:reports_export')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\ReportController::class, 'dashboard']);
        Route::get('/cash-book', [App\Http\Controllers\Api\ReportController::class, 'cashBook']);
        Route::get('/ledger', [App\Http\Controllers\Api\ReportController::class, 'ledger']);
        Route::get('/payments', [App\Http\Controllers\Api\ReportController::class, 'payments']);
        Route::get('/expenses', [App\Http\Controllers\Api\ReportController::class, 'expenses']);
        Route::get('/bookings', [App\Http\Controllers\Api\ReportController::class, 'bookings']);
        Route::get('/outstanding', [App\Http\Controllers\Api\ReportController::class, 'outstanding']);
        Route::get('/deliveries', [App\Http\Controllers\Api\ReportController::class, 'deliveries']);
        Route::get('/daily-collection', [App\Http\Controllers\Api\ReportController::class, 'dailyCollection']);
        Route::get('/monthly-collection', [App\Http\Controllers\Api\ReportController::class, 'monthlyCollection']);
        Route::get('/shop-summary', [App\Http\Controllers\Api\ReportController::class, 'shopSummary']);
        Route::get('/payment-methods', [App\Http\Controllers\Api\ReportController::class, 'paymentMethods']);
        Route::get('/activity-logs', [App\Http\Controllers\Api\ReportController::class, 'activityLogs']);
        Route::get('/notifications', [App\Http\Controllers\Api\ReportController::class, 'notifications']);
        Route::get('/user-activity', [App\Http\Controllers\Api\ReportController::class, 'userActivity']);
    });

    // Health & System Info
    Route::get('/system/diagnostics', [App\Http\Controllers\Api\HealthController::class, 'diagnostics']);
    Route::get('/system/info', [App\Http\Controllers\Api\AppInfoController::class, 'index']);
    
    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/system/queue', [App\Http\Controllers\Api\QueueController::class, 'index']);
        Route::post('/system/queue/{id}/retry', [App\Http\Controllers\Api\QueueController::class, 'retry']);
    });

    // Database Backups
    Route::prefix('backups')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\BackupController::class, 'index']);
        Route::post('/', [App\Http\Controllers\Api\BackupController::class, 'store']);
        Route::post('/{backup}/restore-request', [App\Http\Controllers\Api\BackupController::class, 'requestRestore']);
        Route::post('/{backup}/restore', [App\Http\Controllers\Api\BackupController::class, 'restore']);
    });

    // Booking Module (Role check + shop_access for POST)
    Route::middleware('role:Owner,Shop Manager,Cashier')->group(function () {
        Route::get('bookings/next-number', [BookingController::class, 'nextNumber'])->middleware('shop_access');
        Route::post('bookings', [BookingController::class, 'store'])->middleware('shop_access');
        Route::put('bookings/{booking}', [BookingController::class, 'update'])->middleware('shop_access');
        Route::delete('bookings/{booking}', [BookingController::class, 'destroy']);
    });
    // Everyone can view bookings
    Route::get('bookings', [BookingController::class, 'index']);
    Route::get('bookings/{booking}', [BookingController::class, 'show']);


    // Payment Module (Role check + shop_access for POST)
    Route::middleware('role:Owner,Accountant,Shop Manager,Cashier')->group(function () {
        Route::post('payments', [PaymentController::class, 'store'])->middleware('shop_access');
    });
    // Accountant, Owner, Shop Manager can view payments
    Route::middleware('role:Owner,Accountant,Shop Manager,Viewer')->group(function () {
        Route::get('payments', [PaymentController::class, 'index']);
        Route::get('payments/{payment}', [PaymentController::class, 'show']);
    });

    // Expense Module (Role check + shop_access for POST)
    Route::middleware('role:Owner,Accountant,Shop Manager')->group(function () {
        Route::post('expenses', [ExpenseController::class, 'store'])->middleware('shop_access');
        Route::get('expenses', [ExpenseController::class, 'index']);
        Route::get('expenses/{expense}', [ExpenseController::class, 'show']);
    });

    // Ledger Engine (Read-only + Manual Entries)
    Route::middleware('role:Owner,Accountant,Shop Manager')->group(function () {
        Route::get('ledgers/summary', [LedgerController::class, 'summary']);
        Route::get('ledgers', [LedgerController::class, 'index']);
        Route::post('ledgers', [LedgerController::class, 'store']);
        Route::get('ledgers/{ledger}', [LedgerController::class, 'show']);
    });

});
