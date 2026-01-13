// Stock Audit Logic

// State management for the audit view
let currentAuditStatus = 'pending'; // 'pending' or 'verified'
let currentAuditData = []; // Store fetched data for filtering

/**
 * Main function to render the Stock Audit View.
 * It fetches the pending stock data (Bookings - Deliveries) from the API and displays it.
 * @param {string} shop - The shop prefix (e.g., 'Naseem')
 */
async function renderStockAuditView(shop) {
    const container = document.getElementById('dataTypeContentContainer');

    // Header with Tabs
    const headerHtml = `
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Stock Audit: ${shop}</h2>
                <div class="flex space-x-1 mt-2 bg-slate-100 p-1 rounded-lg inline-flex">
                    <button onclick="switchAuditTab('${shop}', 'pending')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentAuditStatus === 'pending' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Pending Stock
                    </button>
                    <button onclick="switchAuditTab('${shop}', 'verified')" 
                        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentAuditStatus === 'verified' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                        Checked History
                    </button>
                </div>
            </div>
            <div class="flex space-x-3">
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
    content.innerHTML = `
        <div class="flex justify-center p-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
    `;

    try {
        currentAuditData = await fetchStockAuditData(shop, currentAuditStatus);

        if (currentAuditStatus === 'pending') {
            renderPendingTable(shop, currentAuditData);
        } else {
            renderHistoryTable(shop, currentAuditData);
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
 * status: 'pending' | 'verified'
 */
async function fetchStockAuditData(shop, status) {
    // GET /api/:shop/stock_audit?status=...
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
 * Render Pending Stock Table (With Remarks & Check Action & Missing Pcs)
 */
function renderPendingTable(shop, data) {
    const container = document.getElementById('auditContent');

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">No pending stock items found. Great job!</div>`;
        return;
    }

    const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);

    let html = `
        <div class="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm flex items-center">
            <svg class="h-5 w-5 mr-2 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Found <strong>${data.length}</strong> pending items. Total Value: <strong>${formatCurrency(totalBalance)}</strong></span>
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
                <td class="px-6 py-4 font-mono font-bold text-slate-700">${item.billNo}</td>
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
    container.innerHTML = html;
}

/**
 * Render History Table
 */
function renderHistoryTable(shop, data) {
    const container = document.getElementById('auditContent');

    // Header for History (with Search)
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
                <table class="min-w-full divide-y divide-slate-200" id="historyTable">
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

        // Handle undefined amount for old records
        const amountDisplay = (item.amount !== undefined && item.amount !== null)
            ? `<span class="font-bold text-teal-700">${formatCurrency(item.amount)}</span>`
            : '<span class="text-slate-400 italic">-</span>';

        // Helper to safely get string values for search
        const searchTerms = `${item.billNo} ${item.remark || ''}`.toLowerCase();

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

function printAuditList() {
    window.print();
}
