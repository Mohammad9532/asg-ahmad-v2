<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSettingRequest;
use App\Http\Requests\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class SettingsController extends Controller
{
    /**
     * Display a listing of the settings.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Setting::with(['creator', 'updater']);

        // Non-admins can only see public settings
        if (!$request->user()->hasRole(['Super Admin', 'Owner'])) {
            $query->where('is_public', true);
        }

        // Search by key or description
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('key', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('group')) {
            $query->where('group', $request->input('group'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('is_public')) {
            $query->where('is_public', filter_var($request->input('is_public'), FILTER_VALIDATE_BOOLEAN));
        }

        $query->orderBy('group', 'asc')->orderBy('key', 'asc');

        $perPage = $request->input('per_page', 50);
        $settings = $query->paginate($perPage);

        return SettingResource::collection($settings);
    }

    /**
     * Store a newly created setting.
     */
    public function store(StoreSettingRequest $request): SettingResource
    {
        Gate::authorize('create', Setting::class);

        $setting = Setting::create($request->validated());
        $setting->load(['creator', 'updater']);

        return new SettingResource($setting);
    }

    /**
     * Display the specified setting.
     */
    public function show(Setting $setting): SettingResource
    {
        Gate::authorize('view', $setting);
        $setting->load(['creator', 'updater']);
        return new SettingResource($setting);
    }

    /**
     * Update the specified setting.
     */
    public function update(UpdateSettingRequest $request, Setting $setting): SettingResource
    {
        Gate::authorize('update', $setting);

        $setting->update($request->validated());
        $setting->load(['creator', 'updater']);

        return new SettingResource($setting);
    }

    /**
     * Remove the specified setting.
     */
    public function destroy(Setting $setting): Response
    {
        Gate::authorize('delete', $setting);

        $setting->delete();

        return response()->noContent();
    }
}
