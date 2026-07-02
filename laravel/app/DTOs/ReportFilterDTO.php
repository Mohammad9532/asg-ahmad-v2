<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class ReportFilterDTO
{
    public readonly ?int $shop_id;
    public readonly ?string $start_date;
    public readonly ?string $end_date;
    public readonly ?int $payment_method;
    public readonly ?string $source;
    public readonly bool $export;
    public readonly ?string $search;
    public readonly ?string $sort;
    public readonly int $per_page;

    public function __construct(Request $request)
    {
        $this->shop_id = $request->input('shop_id');
        $this->start_date = $request->input('start_date');
        $this->end_date = $request->input('end_date');
        $this->payment_method = $request->input('payment_method');
        $this->source = $request->input('source');
        $this->export = filter_var($request->input('export'), FILTER_VALIDATE_BOOLEAN);
        $this->search = $request->input('search');
        $this->sort = $request->input('sort');
        $this->per_page = (int) $request->input('per_page', 50);
    }
}
