import { state } from './state.js';
import { BASE_URL } from './config.js';
import { formatCurrency } from './utils.js';

// Stock Audit Logic

// State management for the audit view
let currentAuditStatus = 'pending'; // 'pending' | 'verified' | 'archived'
let currentAuditData = []; // Store fetched data for filtering (History/Archived)

/**
 * Main function to render the Stock Audit View.
 * It fetches the pending stock data (Bookings - Deliveries) from the API and displays it.
 * @param {string} shop - The shop prefix (e.g., 'Naseem')
 */
export async function renderStockAuditView(shop) {
    const container = document.getElementById('dataTypeContentContainer');

    // Header with Tabs and Actions
    const headerHtml = `
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Stock Audit: ${shop}</h2>
                <div class="flex flex-wrap gap-2 mt-2 bg-slate-100 p-1 rounded-lg inline-flex">
                    <button onclick="switchAuditTab('${shop}', 'pending')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentAuditStatus === 'pending' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Pending Stock
                    </button>
                    <button onclick="switchAuditTab('${shop}', 'verified')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentAuditStatus === 'verified' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Checked History
                    </button>
                    <button onclick="switchAuditTab('${shop}', 'archived')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentAuditStatus === 'archived' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Archived History
                    </button>
                </div>
            </div>
            <div class="flex flex-wrap gap-3">
                 <button onclick="archiveCurrentAudit('${shop}')" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Start New Audit
                </button>
                 <button onclick="printAuditList()" class="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print List
                </button>
            </div>
        </div>
        <div id="auditContent"></div>
    `;

    container.innerHTML = headerHtml;

    await loadAuditContent(shop);
}

async function switchAuditTab(shop, status) {
    currentAuditStatus = status;
    renderStockAuditView(shop);
}

async function loadAuditContent(shop) {
    const content = document.getElementById('auditContent');

    // --- INSTANT PREVIEW CHECK ---
    const cacheKey = `${shop}|stock_audit|${currentAuditStatus}`;
    if (state.allResults && state.allResults[cacheKey]) {
        currentAuditData = state.allResults[cacheKey];
        if (currentAuditStatus === 'pending') renderPendingTable(shop, currentAuditData);
        else if (currentAuditStatus === 'verified') renderHistoryTable(shop, currentAuditData);
        else if (currentAuditStatus === 'archived') renderArchivedTable(shop, currentAuditData);
        return;
    }

    content.innerHTML = `
        <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
    `;

    try {
        currentAuditData = await fetchStockAuditData(shop, currentAuditStatus);

        // --- CACHE FOR INSTANT RE-VISIT ---
        if (state.allResults) {
            state.allResults[cacheKey] = currentAuditData;
        }

        if (currentAuditStatus === 'pending') {
            renderPendingTable(shop, currentAuditData);
        } else if (currentAuditStatus === 'verified') {
            renderHistoryTable(shop, currentAuditData);
        } else if (currentAuditStatus === 'archived') {
            renderArchivedTable(shop, currentAuditData);
        }

    } catch (err) {
        content.innerHTML = `
            <div class="bg-red-50 text-red-700 p-4 rounded-lg">
                <p>Error loading data: ${err.message}</p>
                 <button onclick="loadAuditContent('${shop}')" class="mt-2 text-sm underline">Retry</button>
            </div>
        `;
    }
}

/**
 * Fetches data from backend.
 * status: 'pending' | 'verified' | 'archived'
 */
async function fetchStockAuditData(shop, status) {
    const url = `${BASE_URL}/api/${shop}/stock_audit?status=${status}`;

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

/**
 * Start New Audit (Archive Current)
 */
async function archiveCurrentAudit(shop) {
    const name = prompt("Enter a name for this audit batch to archive it (e.g., 'Year End 2024'):");
    if (name === null) return; // Cancelled
    if (name.trim() === "") {
        alert("Please enter a valid name.");
        return;
    }

    if (!confirm(`Are you sure you want to archive all currently Checked items as "${name}"? \nThis will reset the Checked History and Pending Stock will populate for the new cycle.`)) {
        return;
    }

    try {
        const url = `${BASE_URL}/api/${shop}/stock_audit/archive`;
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ auditName: name })
        });

        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();

        // --- CLEAR CACHE ON ARCHIVE ---
        if (state.allResults) {
            Object.keys(state.allResults).forEach(key => {
                if (key.startsWith(`${shop}|stock_audit|`)) delete state.allResults[key];
            });
        }

        alert(`Successfully archived ${result.modifiedCount} items!`);

        // Reload view (defaulting to pending or just reload current view)
        // Ideally switch to pending to show the "reset" state
        switchAuditTab(shop, 'pending');

    } catch (err) {
        console.error("Archive Error:", err);
        alert("Failed to archive audit: " + err.message);
    }
}


/**
 * Render Pending Stock Table
 */
function renderPendingTable(shop, data) {
    const container = document.getElementById('auditContent');

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">No pending stock items found. Great job!</div>`;
        return;
    }

    const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);

    let html = `
        <div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
            <div class="flex items-center">
                <svg class="h-5 w-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Found <strong>${data.length}</strong> pending items. Total Value: <strong>${formatCurrency(totalBalance)}</strong></span>
            </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-32">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-16">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Total Amt</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Balance</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-24">Missing Pcs</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-48">Remark</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
    `;

    data.forEach(item => {
        const qtyDisplay = item.qty ? item.qty : '-';
        const qtyValue = item.qty || 0;
        const amountValue = item.balance || 0;

        html += `
            <tr id="row_${item.billNo}" class="hover:bg-slate-50 group transition-colors">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">
                    <button onclick="showBillDetails('${shop}', '${item.billNo}')" 
                        class="text-teal-600 hover:text-teal-800 hover:underline focus:outline-none flex items-center">
                        ${item.billNo}
                        <svg class="w-3 h-3 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${new Date(item.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-slate-700 font-medium">${item.name}</td>
                <td class="px-6 py-4 text-center font-bold text-slate-600">${qtyDisplay}</td>
                 <td class="px-6 py-4 text-right font-medium text-slate-600">${formatCurrency(item.bookedAmount || 0)}</td>
                <td class="px-6 py-4 text-right font-bold text-teal-700">${formatCurrency(item.balance)}</td>
                <td class="px-6 py-3">
                    <input type="number" 
                        id="missing_${item.billNo}" 
                        min="0"
                        class="w-full text-center text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" 
                        placeholder="0"
                    >
                </td>
                <td class="px-6 py-3">
                    <input type="text" 
                        id="remark_${item.billNo}" 
                        class="w-full text-sm border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" 
                        placeholder="Location / Status..."
                    >
                </td>
                <td class="px-6 py-3 text-center">
                    <button onclick="verifyStockAuditItem('${shop}', '${item.billNo}', ${qtyValue}, ${amountValue})" 
                        class="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition-colors shadow-sm border border-green-200"
                        title="Mark as Checked">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;

    // Append Modal Container if not exists
    if (!document.getElementById('billDetailsModal')) {
        const modal = document.createElement('div');
        modal.id = 'billDetailsModal';
        modal.className = 'fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center hidden z-50 p-4 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-95" id="billDetailsContent">
                <!-- Dynamic Content Load Here -->
            </div>
        `;
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeBillDetails();
        });
    }

    container.innerHTML = html;
}

/**
 * Show Bill Details Modal
 */
async function showBillDetails(shop, billNo) {
    const modal = document.getElementById('billDetailsModal');
    const content = document.getElementById('billDetailsContent');

    modal.classList.remove('hidden');
    // Simple entry animation
    setTimeout(() => {
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);

    content.innerHTML = `
        <div class="p-8 flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    `;

    try {
        const url = `${BASE_URL}/api/${shop}/bill_details?billNo=${billNo}`;
        const token = localStorage.getItem('authToken');
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

        if (!res.ok) throw new Error("Failed to fetch details");

        const data = await res.json();
        const { booking, deliveries } = data;

        if (!booking) {
            content.innerHTML = `<div class="p-8 text-center text-red-500">Booking not found for Bill ${billNo}.</div>`;
            return;
        }

        const bookedAmt = booking.amount || 0;
        const totalDelivered = deliveries.reduce((sum, d) => sum + (d.amount || 0), 0);
        const balance = bookedAmt - totalDelivered;

        let deliveryRows = '';
        if (deliveries.length === 0) {
            deliveryRows = `<tr><td colspan="4" class="px-4 py-4 text-center text-slate-400 italic">No deliveries recorded yet.</td></tr>`;
        } else {
            deliveries.forEach((d, idx) => {
                deliveryRows += `
                    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-3 text-slate-600">${idx + 1}</td>
                        <td class="px-4 py-3 font-mono text-slate-700 font-bold">${d.amountType || 'Cash/Card'}</td>
                        <td class="px-4 py-3 text-slate-500">${new Date(d.date).toLocaleDateString()}</td>
                        <td class="px-4 py-3 text-right font-bold text-teal-700">${formatCurrency(d.amount)}</td>
                    </tr>
                `;
            });
        }

        content.innerHTML = `
            <div class="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <svg class="w-6 h-6 mr-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bill #${booking.billNo} Details
                </h3>
                <button onclick="closeBillDetails()" class="text-indigo-100 hover:text-white hover:bg-indigo-500 rounded-full p-1 transition-colors">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="p-6">
                <!-- Booking Info -->
                <div class="bg-indigo-50 rounded-xl p-5 mb-6 border border-indigo-100">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div>
                            <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Date</p>
                            <p class="font-semibold text-indigo-900">${new Date(booking.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Customer</p>
                            <p class="font-semibold text-indigo-900">${booking.name || 'Unknown'}</p>
                        </div>
                        <div>
                             <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Phone</p>
                             <p class="font-semibold text-indigo-900 font-mono">${booking.countryCode || ''} ${booking.phone || '-'}</p>
                        </div>
                         <div>
                             <p class="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1">Order Qty</p>
                             <p class="font-bold text-indigo-900 bg-white inline-block px-2 rounded border border-indigo-200">${booking.qty || 0}</p>
                        </div>
                    </div>
                </div>

                <!-- Financial Summary -->
                <div class="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <p class="text-xs text-slate-500 uppercase font-bold mb-1">Total Booked</p>
                        <p class="text-xl font-bold text-slate-800">${formatCurrency(bookedAmt)}</p>
                    </div>
                     <div class="bg-teal-50 p-4 rounded-lg border border-teal-200">
                        <p class="text-xs text-teal-600 uppercase font-bold mb-1">Total Delivered</p>
                        <p class="text-xl font-bold text-teal-700">${formatCurrency(totalDelivered)}</p>
                    </div>
                     <div class="bg-amber-50 p-4 rounded-lg border border-amber-200 ring-2 ring-amber-100">
                        <p class="text-xs text-amber-600 uppercase font-bold mb-1">Balance Due</p>
                        <p class="text-xl font-bold text-amber-700">${formatCurrency(balance)}</p>
                    </div>
                </div>

                <!-- Delivery History -->
                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-600 text-sm flex justify-between items-center">
                        <span>Delivery History</span>
                        <span class="text-xs font-normal bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">${deliveries.length} Records</span>
                    </div>
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-2 w-12">#</th>
                                <th class="px-4 py-2">Type</th>
                                <th class="px-4 py-2">Date</th>
                                <th class="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${deliveryRows}
                        </tbody>
                    </table>
                </div>
            </div>
            
             <div class="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button onclick="closeBillDetails()" class="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    Close Details
                </button>
            </div>
        `;

    } catch (err) {
        content.innerHTML = `
            <div class="p-8 text-center text-red-500">
                <p>Error loading details.</p>
                <p class="text-sm mt-2 font-mono bg-red-50 p-2 rounded text-red-800">${err.message}</p>
                 <button onclick="closeBillDetails()" class="mt-4 text-sm underline">Close</button>
            </div>
        `;
    }
}

function closeBillDetails() {
    const modal = document.getElementById('billDetailsModal');
    const content = document.getElementById('billDetailsContent');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

/**
 * Render History Table (Current Batch)
 */
function renderHistoryTable(shop, data) {
    const container = document.getElementById('auditContent');

    let html = `
        <div class="mb-4">
            <input type="text" 
                id="historySearchInput" 
                onkeyup="filterHistoryTable()" 
                placeholder="Search by Bill No or Remarks..." 
                class="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
        </div>
    `;

    if (!data || data.length === 0) {
        container.innerHTML = html + `<div class="p-8 text-center text-slate-500">No checked items in history yet.</div>`;
        return;
    }

    html += `
        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200" id="checkedHistoryTable">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase w-32">Amount</th> 
                            <th class="px-6 py-3 text-center text-xs font-bold text-red-500 uppercase w-24">Missing</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase w-full">Remark</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Checked At</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm">
    `;

    data.forEach(item => {
        const missingDisplay = item.missingPcs > 0
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">${item.missingPcs} Missing</span>`
            : '<span class="text-slate-400">-</span>';

        const amountDisplay = (item.amount !== undefined && item.amount !== null)
            ? `<span class="font-bold text-teal-700">${formatCurrency(item.amount)}</span>`
            : '<span class="text-slate-400 italic">-</span>';

        // Helper to safely get string values for search
        let searchTerms = `${item.billNo} ${item.remark || ''}`.toLowerCase();
        if (item.missingPcs > 0) {
            searchTerms += ` missing ${item.missingPcs}`;
        }

        html += `
            <tr class="hover:bg-slate-50 history-row" data-search="${searchTerms}">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">${item.billNo}</td>
                <td class="px-6 py-4 text-center text-slate-600 font-semibold">${item.qty !== undefined && item.qty !== null ? item.qty : '-'}</td>
                 <td class="px-6 py-4 text-right">${amountDisplay}</td>
                <td class="px-6 py-4 text-center">${missingDisplay}</td>
                <td class="px-6 py-4 text-slate-600">${item.remark || '<span class="text-slate-400 italic">No remark</span>'}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                    ${new Date(item.checkedAt).toLocaleDateString()} 
                    <span class="text-slate-400 ml-1">${new Date(item.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Checked
                    </span>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
}

/**
 * Render Archived Table (All Past Audits)
 */
/**
 * Render Archived Table (Folder View or Details View)
 */
let currentArchivedBatch = null; // State to track selected batch
let currentShopForArchive = ''; // Track shop for navigation

function renderArchivedTable(shop, data) {
    const container = document.getElementById('auditContent');
    currentShopForArchive = shop; // Store for onclick handlers

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">No archived history found.</div>`;
        return;
    }

    if (currentArchivedBatch) {
        renderArchivedDetails(shop, data, currentArchivedBatch);
    } else {
        renderArchivedFolders(shop, data);
    }
}

/**
 * Render Folders (Grouped by Batch Label)
 */
function renderArchivedFolders(shop, data) {
    const container = document.getElementById('auditContent');

    // Group data by batchLabel
    const batches = {};
    data.forEach(item => {
        const label = item.batchLabel || 'Unnamed Audit';
        if (!batches[label]) {
            batches[label] = {
                label: label,
                count: 0,
                totalAmount: 0,
                missingCount: 0,
                lastChecked: item.checkedAt
            };
        }
        batches[label].count++;
        batches[label].totalAmount += (item.amount || 0);
        if (item.missingPcs > 0) batches[label].missingCount += item.missingPcs;

        // Keep track of most recent date in batch
        if (new Date(item.checkedAt) > new Date(batches[label].lastChecked)) {
            batches[label].lastChecked = item.checkedAt;
        }
    });

    // Convert to array and sort by date (newest first)
    const sortedBatches = Object.values(batches).sort((a, b) => new Date(b.lastChecked) - new Date(a.lastChecked));

    let html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
    `;

    sortedBatches.forEach(batch => {
        html += `
            <div onclick="openArchiveBatch('${batch.label}')" 
                class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500">
                <div class="flex justify-between items-start mb-4">
                    <div class="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                     <div class="text-right">
                        <span class="block text-xs text-slate-400 uppercase font-bold tracking-wider">Total Value</span>
                        <span class="block text-lg font-bold text-slate-700">${formatCurrency(batch.totalAmount)}</span>
                    </div>
                </div>
                
                <h3 class="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">${batch.label}</h3>
                <p class="text-sm text-slate-500 mb-4">Last updated: ${new Date(batch.lastChecked).toLocaleDateString()}</p>
                
                <div class="border-t border-slate-100 pt-4 flex justify-between items-center text-sm">
                    <span class="text-slate-600 font-medium">${batch.count} Items</span>
                     ${batch.missingCount > 0
                ? `<span class="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">${batch.missingCount} Missing</span>`
                : `<span class="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">All Clear</span>`
            }
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Render Details for a specific Batch
 */
function renderArchivedDetails(shop, allData, batchLabel) {
    const container = document.getElementById('auditContent');
    const filteredData = allData.filter(item => (item.batchLabel || 'Unnamed Audit') === batchLabel);

    // Add Search Filter & Back Button
    let html = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <button onclick="closeArchiveBatch()" class="flex items-center text-indigo-600 hover:text-indigo-800 font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Archives
            </button>
            <h3 class="text-xl font-bold text-slate-800">${batchLabel}</h3>
            <div class="w-full md:w-1/3">
                <input type="text" 
                    id="archivedSearchInput" 
                    onkeyup="filterArchivedTable()" 
                    placeholder="Search in ${batchLabel}..." 
                    class="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
            </div>
        </div>
    `;

    html += `
        <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-50">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200" id="archivedTable">
                    <thead class="bg-indigo-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-800 uppercase w-24">Bill No</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-indigo-500 uppercase w-20">Qty</th>
                            <th class="px-6 py-3 text-right text-xs font-bold text-indigo-500 uppercase w-32">Amount</th>
                            <th class="px-6 py-3 text-center text-xs font-bold text-red-500 uppercase w-24">Missing</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-500 uppercase w-full">Remark</th>
                            <th class="px-6 py-3 text-left text-xs font-bold text-indigo-500 uppercase whitespace-nowrap">Checked At</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 text-sm bg-white">
    `;

    filteredData.forEach(item => {
        const missingDisplay = item.missingPcs > 0
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">${item.missingPcs} Missing</span>`
            : '<span class="text-slate-400">-</span>';

        const amountDisplay = (item.amount !== undefined && item.amount !== null)
            ? `<span class="font-bold text-slate-700">${formatCurrency(item.amount)}</span>`
            : '<span class="text-slate-400 italic">-</span>';

        // Helper to safely get string values for search
        const searchTerms = `${item.billNo} ${item.remark || ''}`.toLowerCase();

        html += `
            <tr class="hover:bg-slate-50 archived-row" data-search="${searchTerms}">
                <td class="px-6 py-4 font-mono font-bold text-slate-700">${item.billNo}</td>
                <td class="px-6 py-4 text-center text-slate-600 font-semibold">${item.qty !== undefined && item.qty !== null ? item.qty : '-'}</td>
                <td class="px-6 py-4 text-right">${amountDisplay}</td>
                <td class="px-6 py-4 text-center">${missingDisplay}</td>
                <td class="px-6 py-4 text-slate-600">${item.remark || '<span class="text-slate-400 italic">No remark</span>'}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                    ${new Date(item.checkedAt).toLocaleDateString()} 
                    <span class="text-slate-400 ml-1">${new Date(item.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
}

function openArchiveBatch(batchLabel) {
    currentArchivedBatch = batchLabel;
    renderArchivedTable(currentShopForArchive, currentAuditData);
}

function closeArchiveBatch() {
    currentArchivedBatch = null;
    renderArchivedTable(currentShopForArchive, currentAuditData);
}

/**
 * Filter History Table
 */
function filterHistoryTable() {
    const input = document.getElementById('historySearchInput');
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('.history-row');

    rows.forEach(row => {
        const searchData = row.getAttribute('data-search');
        if (searchData && searchData.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

function filterArchivedTable() {
    const input = document.getElementById('archivedSearchInput');
    const filter = input.value.toLowerCase();
    const rows = document.querySelectorAll('.archived-row');

    rows.forEach(row => {
        const searchData = row.getAttribute('data-search');
        if (searchData && searchData.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}


/**
 * Verify Item (Send to Backend)
 */
async function verifyStockAuditItem(shop, billNo, qty, amount) {
    const remarkInput = document.getElementById(`remark_${billNo}`);
    const missingInput = document.getElementById(`missing_${billNo}`);

    const remark = remarkInput ? remarkInput.value : '';
    const missingPcs = missingInput && missingInput.value ? missingInput.value : 0;

    // Optimistic UI Update: Fade out row
    const row = document.getElementById(`row_${billNo}`);
    if (row) {
        row.style.transition = 'all 0.5s';
        row.style.opacity = '0.5';
        row.style.backgroundColor = '#f0fdf4'; // Light green
    }

    try {
        const url = `${BASE_URL}/api/${shop}/stock_audit/verify`;
        const token = localStorage.getItem('authToken');

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ billNo, remark, qty, missingPcs, amount })
        });

        // --- CLEAR CACHE ON VERIFICATION ---
        // We need to invalidate both pending and verified views
        if (state.allResults) {
            delete state.allResults[`${shop}|stock_audit|pending`];
            delete state.allResults[`${shop}|stock_audit|verified`];
        }

        // Add success effect and remove
        if (row) {
            row.innerHTML = `<td colspan="9" class="px-6 py-4 text-center text-green-700 font-bold bg-green-50">Verified! Moved to History.</td>`;
            setTimeout(() => {
                row.remove();
            }, 1000);
        }

    } catch (error) {
        console.error("Verification Error:", error);
        alert("Failed to verify item: " + error.message);
        if (row) {
            row.style.opacity = '1';
            row.style.backgroundColor = '';
        }
    }
}

// Attach functions to window for global access
window.switchAuditTab = switchAuditTab;
window.archiveCurrentAudit = archiveCurrentAudit;
window.showBillDetails = showBillDetails;
window.verifyStockAuditItem = verifyStockAuditItem;
window.closeBillDetails = closeBillDetails;
window.openArchiveBatch = openArchiveBatch;
window.closeArchiveBatch = closeArchiveBatch;
window.filterHistoryTable = filterHistoryTable;
window.filterArchivedTable = filterArchivedTable;
window.loadAuditContent = loadAuditContent; // Used in Retry button
