import { state } from './state.js';
import { BASE_URL } from './config.js';
import { formatCurrency } from './utils.js';

let currentExcessData = [];

/**
 * Main function to render the Excess Delivery View.
 * It fetches bills where Delivery > Booking from the API and displays them.
 */
export async function renderExcessDeliveryView(shop) {
    const container = document.getElementById('dataTypeContentContainer');

    const headerHtml = `
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Excess Delivery & Stock Audit Discrepancies: ${shop}</h2>
                <p class="text-sm text-slate-500 mt-1">Reconciling the 3,706 AED gap between Dashboard and Audit records.</p>
            </div>
            <div class="flex flex-wrap gap-3">
                 <button onclick="window.printExcessDeliveryList()" class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print List
                </button>
            </div>
        </div>
        <div id="excessContent"></div>
    `;

    container.innerHTML = headerHtml;

    // Make print generic function reachable globally
    window.printExcessDeliveryList = () => {
        const printContent = document.getElementById('excessTableContainer');
        if (!printContent) return;

        const originalContent = document.body.innerHTML;
        const shopTitle = `<h2>Excess Delivery Report - ${shop}</h2>`;

        document.body.innerHTML = shopTitle + printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload(); // Quick way to restore event listeners after print replaces body
    };

    await loadExcessContent(shop);
}

async function loadExcessContent(shop) {
    const content = document.getElementById('excessContent');
    const start = state.dateRange?.start || '';
    const end = state.dateRange?.end || '';

    const cacheKey = `${shop}|excess_delivery|${start}_${end}`;
    if (state.allResults && state.allResults[cacheKey]) {
        currentExcessData = state.allResults[cacheKey];
        renderExcessTable(shop, currentExcessData);
        return;
    }

    content.innerHTML = `
        <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
    `;

    try {
        currentExcessData = await fetchExcessData(shop);

        if (state.allResults) {
            state.allResults[cacheKey] = currentExcessData;
        }

        renderExcessTable(shop, currentExcessData);

    } catch (err) {
        content.innerHTML = `
            <div class="bg-red-50 text-red-700 p-4 rounded-lg">
                <p>Error loading data: ${err.message}</p>
                 <button onclick="loadExcessContent('${shop}')" class="mt-2 text-sm underline">Retry</button>
            </div>
        `;
    }
}

async function fetchExcessData(shop) {
    let url = `${BASE_URL}/api/${shop}/excess_delivery`;
    if (state.dateRange?.start && state.dateRange?.end) {
        url += `?startDate=${state.dateRange.start}&endDate=${state.dateRange.end}`;
    }

    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
    }
    return await response.json();
}

function renderExcessTable(shop, data) {
    const container = document.getElementById('excessContent');

    // Handle data structure
    const excess = (data && data.excess) ? data.excess : [];
    const cancelled = (data && data.cancelled) ? data.cancelled : [];
    const manual = (data && data.manual) ? data.manual : [];

    if (excess.length === 0 && cancelled.length === 0 && manual.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <div class="bg-teal-50 text-teal-600 p-4 rounded-full mb-4">
                    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-slate-800">No Discrepancies Found</h3>
                <p class="text-slate-500 max-w-xs text-center mt-2">All balances match across Dashboard and Audit records. Your stock is perfectly reconciled!</p>
            </div>
        `;
        return;
    }

    const totalExcessAmt = excess.reduce((sum, item) => sum + item.extraAmount, 0);
    const totalCancelledAmt = cancelled.reduce((sum, item) => sum + item.deliveredAmount, 0);
    const totalManualDiff = manual.reduce((sum, item) => sum + item.diff, 0);
    const grandTotalImpact = totalExcessAmt + totalCancelledAmt + totalManualDiff;

    let html = `
        <div id="excessTableContainer" class="space-y-12">
            <!-- Summary Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Impact</p>
                    <p class="text-2xl font-black text-slate-800">${formatCurrency(grandTotalImpact)}</p>
                    <div class="mt-2 text-[10px] text-slate-400">Sum of all identified gaps</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                    <p class="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Excess Deliveries</p>
                    <p class="text-xl md:text-2xl font-black text-slate-800">${formatCurrency(totalExcessAmt)}</p>
                    <div class="mt-2 text-[10px] text-slate-400">${excess.length} bills with extra amount</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
                    <p class="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Cancelled Bills</p>
                    <p class="text-xl md:text-2xl font-black text-slate-800">${formatCurrency(totalCancelledAmt)}</p>
                    <div class="mt-2 text-[10px] text-slate-400">${cancelled.length} deliveries after cancel</div>
                </div>
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                    <p class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Manual Overrides</p>
                    <p class="text-xl md:text-2xl font-black text-slate-800">${formatCurrency(totalManualDiff)}</p>
                    <div class="mt-2 text-[10px] text-slate-400">${manual.length} audit calculation gaps</div>
                </div>
            </div>

            <!-- EXCESS SECTION -->
            ${excess.length > 0 ? `
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center">
                        <span class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-2">
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </span>
                        Excess Deliveries
                    </h3>
                    <span class="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-100">Action Required</span>
                </div>

                <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                    <div class="">
                        <table class="min-w-full divide-y divide-slate-200 block md:table">
                            <thead class="bg-slate-50 hidden md:table-header-group">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Bill No</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Booked</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Delivered</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-red-600 uppercase">Extra</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 text-[13px] block md:table-row-group">
                                ${excess.map(item => `
                                    <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-50 md:border-none mb-4 md:mb-0 relative py-1">
                                        <td class="px-6 py-2.5 font-mono font-bold text-teal-600 cursor-pointer underline block md:table-cell border-b border-slate-50 md:border-none bg-slate-50/50 md:bg-transparent" onclick="window.showBillDetails('${shop}', '${item.billNo}')">
                                            <span class="md:hidden text-[10px] text-slate-400 uppercase font-black tracking-tight mr-2">Bill No:</span> ${item.billNo}
                                        </td>
                                        <td class="px-6 py-2.5 text-slate-700 font-medium block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Customer</span> ${item.name}
                                        </td>
                                        <td class="px-6 py-2.5 text-right text-slate-500 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Booked</span> ${formatCurrency(item.bookedAmount)}
                                        </td>
                                        <td class="px-6 py-2.5 text-right text-slate-700 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Delivered</span> ${formatCurrency(item.deliveredAmount)}
                                        </td>
                                        <td class="px-6 py-2.5 text-right font-black text-red-600 block md:table-cell md:border-none flex justify-between items-center md:block bg-red-50/30 md:bg-transparent">
                                            <span class="md:hidden font-black text-red-600 uppercase text-[10px] tracking-tight">Extra</span> ${formatCurrency(item.extraAmount)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>` : ''}

            <!-- CANCELLED SECTION -->
            ${cancelled.length > 0 ? `
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center">
                        <span class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mr-2">
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        Deliveries on Cancelled Bills
                    </h3>
                     <span class="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">Suspicious</span>
                </div>

                <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                    <div class="">
                        <table class="min-w-full divide-y divide-slate-200 block md:table">
                            <thead class="bg-slate-50 hidden md:table-header-group">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Bill No</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                                    <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-amber-700 uppercase">Delivered Amt</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 text-[13px] block md:table-row-group">
                                ${cancelled.map(item => `
                                    <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-50 md:border-none mb-4 md:mb-0 relative py-1">
                                        <td class="px-6 py-2.5 font-mono font-bold text-teal-600 cursor-pointer underline block md:table-cell border-b border-slate-50 md:border-none bg-slate-50/50 md:bg-transparent" onclick="window.showBillDetails('${shop}', '${item.billNo}')">
                                            <span class="md:hidden text-[10px] text-slate-400 uppercase font-black tracking-tight mr-2">Bill No:</span> ${item.billNo}
                                        </td>
                                        <td class="px-6 py-2.5 text-slate-700 font-medium block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Customer</span> ${item.name}
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-center block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Status</span>
                                            <span class="px-2 py-1 rounded-md bg-red-100 text-red-700 font-bold uppercase text-[10px]">${item.status}</span>
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-right font-black text-amber-700 block md:table-cell md:border-none flex justify-between items-center md:block bg-amber-50/30 md:bg-transparent">
                                            <span class="md:hidden font-bold text-amber-600 uppercase text-xs">Delivered Amt</span> ${formatCurrency(item.deliveredAmount)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>` : ''}

            <!-- MANUAL OVERRIDES SECTION -->
            ${manual.length > 0 ? `
            <section>
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center">
                        <span class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2">
                             <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </span>
                        Manual Audit Overrides
                    </h3>
                     <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">Data Entry Error</span>
                </div>

                <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                    <div class="">
                        <table class="min-w-full divide-y divide-slate-200 block md:table">
                            <thead class="bg-slate-50 hidden md:table-header-group">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Bill No</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Math Balance</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Saved Audit</th>
                                    <th class="px-6 py-3 text-right text-xs font-bold text-indigo-600 uppercase">Gap</th>
                                    <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Audit Remark</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200 text-[13px] block md:table-row-group">
                                ${manual.map(item => `
                                    <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0 relative py-1">
                                        <td class="px-6 py-3 font-mono font-bold text-teal-600 cursor-pointer underline block md:table-cell border-b border-slate-50 md:border-none bg-slate-50/50 md:bg-transparent" onclick="window.showBillDetails('${shop}', '${item.billNo}')">
                                            <span class="md:hidden text-xs text-slate-400 uppercase font-normal mr-2">Bill No:</span> ${item.billNo}
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-slate-500 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Math Balance</span> ${formatCurrency(item.calculatedBalance)}
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-slate-700 font-medium block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Saved Audit</span> ${formatCurrency(item.actualAuditAmount)}
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-right font-black text-indigo-600 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-indigo-50/30 md:bg-transparent">
                                            <span class="md:hidden font-bold text-indigo-600 uppercase text-xs">Gap</span> ${formatCurrency(item.diff)}
                                        </td>
                                        <td class="px-6 py-2 md:py-4 text-slate-500 italic text-xs block md:table-cell md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Audit Remark</span> ${item.remark || '-'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>` : ''}
        </div>
    `;
    container.innerHTML = html;
}
