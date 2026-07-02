<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * Display a listing of active notifications.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Notification::forCurrentUser()->active();

        // Search by title or message
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        // Filter by read status
        if ($request->filled('is_read')) {
            $query->where('is_read', filter_var($request->input('is_read'), FILTER_VALIDATE_BOOLEAN));
        }

        // Date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        }

        $query->orderBy('created_at', 'desc');

        $perPage = $request->input('per_page', 20);
        $notifications = $query->paginate($perPage);

        return NotificationResource::collection($notifications);
    }

    /**
     * Get latest 10 unread notifications for dashboard dropdown.
     */
    public function unread(Request $request): AnonymousResourceCollection
    {
        $notifications = Notification::forCurrentUser()
            ->active()
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return NotificationResource::collection($notifications);
    }

    /**
     * Get count of unread notifications for dashboard badge.
     */
    public function count(Request $request): JsonResponse
    {
        $count = Notification::forCurrentUser()
            ->active()
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        Gate::authorize('markAsRead', $notification);

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * Mark all active notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::forCurrentUser()
            ->active()
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * Archive a notification (replaces deletion).
     */
    public function archive(Notification $notification): JsonResponse
    {
        Gate::authorize('archive', $notification);

        $notification->update([
            'is_archived' => true,
        ]);

        return response()->json(['message' => 'Notification archived.']);
    }
}
