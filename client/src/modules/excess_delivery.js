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
                <h2 class="text-2xl font-bold text-slate-800">Excess Delivery: ${shop}</h2>
                <p class="text-sm text-slate-500 mt-1">Showing bills where total delivered amount exceeds the original booked amount.</p>
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

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">No excess deliveries found. All balances look good!</div>`;
        return;
    }

    const totalExtra = data.reduce((sum, item) => sum + item.extraAmount, 0);

    let html = `
        <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
            <div class="flex items-center">
                <svg class="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Found <strong>${data.length}</strong> overpaid items. Total Excess: <strong>${formatCurrency(totalExtra)}</strong></span>
            </div>
        </div>

        <div id="excessTableContainer" class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Booked Amt</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Delivered Amt</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-red-600 uppercase w-32">Extra Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
    `;

    data.forEach(item => {
        html += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">
                    <button onclick="window.showBillDetails('${shop}', '${item.billNo}')" 
                        class="text-teal-600 hover:text-teal-800 hover:underline focus:outline-none flex items-center">
                        ${item.billNo}
                        <svg class="w-3 h-3 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${new Date(item.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-slate-700 font-medium">${item.name}</td>
                <td class="px-6 py-4 text-right font-medium text-slate-600">${formatCurrency(item.bookedAmount || 0)}</td>
                <td class="px-6 py-4 text-right font-medium text-teal-700">${formatCurrency(item.deliveredAmount || 0)}</td>
                <td class="px-6 py-4 text-right font-bold text-red-600">${formatCurrency(item.extraAmount)}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
}
