<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLedgerEntryRequest;
use App\Http\Resources\LedgerResource;
use App\Models\Ledger;
use App\Models\User;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class LedgerController extends Controller
{
    private LedgerService $ledgerService;

    public function __construct(LedgerService $ledgerService)
    {
        $this->ledgerService = $ledgerService;
    }

    /**
     * Store a new manual ledger entry.
     */
    public function store(StoreLedgerEntryRequest $request): LedgerResource
    {
        $data = $request->validated();
        
        $debit = $data['type'] === 'DEBIT' ? $data['amount'] : 0;
        $credit = $data['type'] === 'CREDIT' ? $data['amount'] : 0;

        $ledgerData = [
            'shop_id' => $data['shop_id'],
            'entry_date' => $data['entry_date'],
            'transaction_type' => $data['type'],
            'source' => $data['source'],
            'reference_type' => User::class,
            'reference_id' => auth()->id(),
            'payment_method_id' => $data['payment_method_id'],
            'debit' => $debit,
            'credit' => $credit,
            'remarks' => $data['remarks'],
            'created_by' => auth()->id(),
        ];

        $ledger = $this->ledgerService->record($ledgerData);
        $ledger->load(['shop', 'paymentMethod', 'creator']);

        return new LedgerResource($ledger);
    }
    /**
     * Display a listing of the ledger entries.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Ledger::forCurrentUser()->with(['shop', 'paymentMethod', 'creator']);

        $this->applyFilters($query, $request);

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('transaction_no', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        $query->orderBy('entry_date', 'desc')->orderBy('id', 'desc');

        $perPage = $request->input('per_page', 15);
        $ledgers = $query->paginate($perPage);

        return LedgerResource::collection($ledgers);
    }

    /**
     * Display the specified ledger entry.
     */
    public function show(Ledger $ledger): LedgerResource
    {
        Gate::authorize('view', $ledger);
        $ledger->load(['shop', 'paymentMethod', 'reference', 'reversedOriginal', 'reversedBy', 'creator', 'updater']);
        return new LedgerResource($ledger);
    }

    /**
     * Retrieve aggregated summary of ledgers.
     */
    public function summary(Request $request): JsonResponse
    {
        $query = Ledger::forCurrentUser();

        // Use same filters as index (except search)
        $this->applyFilters($query, $request);

        // Exclude reversed entries from summary to prevent double counting
        $query->where('is_reversed', false);

        $totals = $query->selectRaw('SUM(credit) as total_credit, SUM(debit) as total_debit')
                        ->first();

        $credit = (float) ($totals->total_credit ?? 0);
        $debit = (float) ($totals->total_debit ?? 0);
        $balance = $credit - $debit;

        return response()->json([
            'credit' => $credit,
            'debit' => $debit,
            'balance' => $balance,
        ]);
    }

    /**
     * Helper to apply common filters to ledger queries.
     */
    private function applyFilters($query, Request $request): void
    {
        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->input('shop_id'));
        }

        if ($request->filled('source')) {
            $query->where('source', $request->input('source'));
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->input('payment_method_id'));
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('entry_date', [
                $request->input('start_date'),
                $request->input('end_date')
            ]);
        } elseif ($request->filled('start_date')) {
            $query->where('entry_date', '>=', $request->input('start_date'));
        } elseif ($request->filled('end_date')) {
            $query->where('entry_date', '<=', $request->input('end_date'));
        }
    }
}
