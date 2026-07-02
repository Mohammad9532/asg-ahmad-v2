<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use App\Models\Setting;

class AppInfoController extends Controller
{
    /**
     * Display application information.
     */
    public function index(): JsonResponse
    {
        $companyName = 'ASG ERP';
        try {
            $setting = Setting::where('key', 'company_name')->first();
            if ($setting && $setting->value) {
                $companyName = $setting->value;
            }
        } catch (\Exception $e) {
            // Settings table might not be accessible
        }

        return response()->json([
            'company_name' => $companyName,
            'erp_version' => config('app.erp_version', '2.0.0'),
            'api_version' => config('app.api_version', 'v1'),
            'build_number' => config('app.build_number', '1054'),
            'environment' => app()->environment(),
            'last_deployment' => config('app.last_deployment', now()->subDays(2)->toIso8601String()),
        ]);
    }
}
