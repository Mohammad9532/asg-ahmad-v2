<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\DTOs\ReportFilterDTO;
use App\Services\DashboardService;
use App\Services\ReportsService;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    private DashboardService $dashboardService;
    private ReportsService $reportsService;

    public function __construct(DashboardService $dashboardService, ReportsService $reportsService)
    {
        $this->dashboardService = $dashboardService;
        $this->reportsService = $reportsService;
    }

    private function getDTO(Request $request): ReportFilterDTO
    {
        return new ReportFilterDTO($request);
    }

    public function dashboard(Request $request): JsonResponse
    {
        return response()->json($this->dashboardService->getSummary($this->getDTO($request)));
    }

    public function cashBook(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getCashBook($this->getDTO($request)));
    }

    public function ledger(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getLedgerReport($this->getDTO($request)));
    }

    public function payments(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getPaymentReport($this->getDTO($request)));
    }

    public function expenses(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getExpenseReport($this->getDTO($request)));
    }

    public function bookings(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getBookingReport($this->getDTO($request)));
    }

    public function outstanding(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getOutstandingReport($this->getDTO($request)));
    }

    public function deliveries(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getDeliveryReport($this->getDTO($request)));
    }

    public function dailyCollection(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getDailyCollection($this->getDTO($request)));
    }

    public function monthlyCollection(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getMonthlyCollection($this->getDTO($request)));
    }

    public function shopSummary(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getShopSummary($this->getDTO($request)));
    }

    public function paymentMethods(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getPaymentMethodSummary($this->getDTO($request)));
    }

    public function activityLogs(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getActivityLogReport($this->getDTO($request)));
    }

    public function notifications(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getNotificationReport($this->getDTO($request)));
    }

    public function userActivity(Request $request): JsonResponse
    {
        return response()->json($this->reportsService->getUserActivityReport($this->getDTO($request)));
    }
}
