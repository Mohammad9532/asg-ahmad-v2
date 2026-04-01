import { state } from './state.js';
import { BASE_URL } from './config.js';
import { formatCurrency, isCanceledStatus } from './utils.js';

// --- DAILY LEDGER LOGIC ---

/**
 * Renders the Daily Ledger View mimicking a cash book.
 * @param {string} shopPrefix 
 */
export async function renderDailyLedger(shopPrefix, forcedDate = null) {
    // Scroll to top smoothly so if they click from the bottom history table, they see the result immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const container = document.getElementById('dataTypeContentContainer');
    // Default to today in YYYY-MM-DD format (local time)
    let targetDate = forcedDate;
    if (!targetDate) {
        targetDate = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
    }

    // --- INSTANT PREVIEW CHECK ---
    const cacheKey = `${shopPrefix}|daily_ledger|${targetDate}`;
    if (state.allResults && state.allResults[cacheKey]) {
        renderLedgerTable(shopPrefix, state.allResults[cacheKey], targetDate);
        return;
    }

    // Show Loading
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-12 h-96">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p class="text-slate-500 font-medium text-lg animate-pulse">Loading ${shopPrefix} Ledger...</p>
        </div>
    `;

    try {
        const data = await fetchLedgerData(shopPrefix, targetDate);

        // --- CACHE THE RESULT ---
        if (state.allResults) {
            state.allResults[cacheKey] = data;
        }

        renderLedgerTable(shopPrefix, data, targetDate);

    } catch (err) {
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm mx-auto max-w-2xl mt-8">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-lg leading-6 font-medium text-red-800">Error Loading Ledger</h3>
                        <div class="mt-2 text-red-700"><p>${err.message}</p></div>
                        <div class="mt-4">
                            <button onclick="renderDailyLedger('${shopPrefix}', '${targetDate}')" class="text-sm font-medium text-red-600 hover:text-red-500 underline">
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Fetch Ledger Data from API
 */
async function fetchLedgerData(shop, date) {
    // API Endpoint: /api/:shop/daily_ledger?date=YYYY-MM-DD
    const url = `${BASE_URL}/api/${shop}/daily_ledger?date=${date}`;
    const token = localStorage.getItem('authToken');

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }
    return await response.json();
}

/**
 * Render the Ledger Table HTML
 */
function renderLedgerTable(shop, data, date) {
    const container = document.getElementById('dataTypeContentContainer');
    const { entries, openingBalance, closingBalance, adjustments, grossBooking } = data;

    // Calculate Totals for Summary
    const totals = calculateLedgerTotals(entries, openingBalance, shop);

    // Adjustments
    const shortCash = adjustments && adjustments.short ? adjustments.short : 0;
    const extraCash = adjustments && adjustments.extra ? adjustments.extra : 0;
    const finalClosing = totals.closingBalance - shortCash + extraCash;

    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let adjustmentHtml = '';

    if (shortCash > 0) {
        adjustmentHtml += `
            <div class="flex justify-between items-center text-red-600 text-sm mt-1 px-2">
                <span>Less: Short Cash</span>
                <span class="font-bold">(${formatCurrency(shortCash)})</span>
            </div>
        `;
    }
    if (extraCash > 0) {
        adjustmentHtml += `
            <div class="flex justify-between items-center text-green-600 text-sm mt-1 px-2">
                <span>Add: Extra Cash</span>
                <span class="font-bold">+${formatCurrency(extraCash)}</span>
            </div>
        `;
    }

    const html = `
        <div class="max-w-5xl mx-auto">
            <!-- Header \u0026 Controls -->
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div class="flex items-center gap-4">
                     <button onclick="changeLedgerDate('${shop}', '${date}', -1)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div class="text-center">
                        <h2 class="text-xl font-bold text-slate-800">${shop} Daily Ledger</h2>
                        <input type="date" value="${date}" onchange="renderDailyLedger('${shop}', this.value)" 
                            class="mt-1 block w-full text-center border-none text-slate-500 focus:ring-0 text-sm font-semibold cursor-pointer hover:text-indigo-600 bg-transparent">
                    </div>
                     <button onclick="changeLedgerDate('${shop}', '${date}', 1)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>

                <div class="flex gap-2">
                     <button onclick="showLedgerSettingsModal('${shop}')" class="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors border border-slate-200 shadow-sm" title="Ledger Settings">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                     <button onclick="showAdjustmentModal('${shop}', '${date}', ${shortCash}, ${extraCash})" class="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors border border-indigo-200 shadow-sm">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span class="hidden sm:inline">Adjust Cash</span>
                    </button>
                    <div class="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">Reviewing</span>
                        <span class="block font-semibold text-slate-700">${formattedDate}</span>
                    </div>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- Opening Balance -->
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <span class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Opening Balance</span>
                    <span class="text-2xl font-mono font-bold text-slate-700">${formatCurrency(openingBalance)}</span>
                </div>

                <!-- Closing Balance -->
                <div class="bg-indigo-600 p-4 rounded-xl shadow-md flex flex-col justify-center items-center text-white relative overflow-hidden group">
                    <div class="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full transform group-hover:scale-150 transition-transform duration-500"></div>
                    <span class="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">Net Cash in Box</span>
                    <span class="text-3xl font-mono font-bold">${formatCurrency(finalClosing)}</span>
                     ${adjustmentHtml}
                </div>
            </div>

            <!-- Ledger Entries Table -->
            <div class="mb-4">
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center shadow-sm">
                    <span class="text-sm font-semibold text-indigo-800">Total Bookings (Orders) Today:</span>
                    <span class="font-mono font-bold text-indigo-700">${formatCurrency(grossBooking || 0)}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1 ml-1">* Bookings are promised revenue and do not affect the physical cash box balance below.</p>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th class="px-6 py-4 text-left w-24">Category</th>
                                <th class="px-6 py-4 text-left">Description</th>
                                <th class="px-6 py-4 text-right w-32">Debit (Out)</th>
                                <th class="px-6 py-4 text-right w-32">Credit (In)</th>
                                <th class="px-6 py-4 text-center w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${totals.rowsHtml}
                        </tbody>
                        <tfoot class="bg-slate-50 font-bold text-slate-700 border-t border-slate-200">
                            <tr>
                                <td colspan="2" class="px-6 py-4 text-right uppercase tracking-wider text-xs">Daily Totals</td>
                                <td class="px-6 py-4 text-right text-red-600">${formatCurrency(totals.totalExpense)}</td>
                                <td class="px-6 py-4 text-right text-green-600">${formatCurrency(totals.totalIncome)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

             <!-- Render Recent History (Last 30 Days) -->
             <div class="mt-8">
                 <h3 class="text-lg font-bold text-slate-800 mb-4 px-2">Last 30 Days Overview</h3>
                 <div id="ledgerHistoryContainer" class="bg-slate-50 rounded-xl p-4 text-center text-slate-500 text-sm animate-pulse">
                    Loading history...
                 </div>
             </div>
        </div>
    `;

    container.innerHTML = html;

    // Load History in background
    loadLedgerHistory(shop, date);
}

function calculateLedgerTotals(entries, openingBalance, shop) {
    let totalIncome = 0;
    let totalExpense = 0; // Cumulative for balance
    let operationalExpense = 0;
    let profitPayout = 0;
    let rowsHtml = '';

    if (entries.length === 0) {
        rowsHtml = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 italic">No transactions recorded for this day.</td></tr>`;
    } else {
        // Prepend the Opening Balance Row
        rowsHtml += `
            <tr class="bg-indigo-50/50 border-b border-indigo-100/50">
                <td class="px-6 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 tracking-wider uppercase">
                        START
                    </span>
                </td>
                <td class="px-6 py-3 font-semibold text-slate-700">
                    Opening Balance
                </td>
                <td class="px-6 py-3 text-right text-slate-400">-</td>
                <td class="px-6 py-3 text-right font-mono font-bold text-indigo-700">
                    ${formatCurrency(openingBalance)}
                </td>
            </tr>
        `;

        entries.forEach(entry => {
            const amount = entry.amount || 0;
            const isCredit = entry.type === 'credit'; // In (Income)
            const isDebit = entry.type === 'debit';   // Out (Expense)

            if (isCredit) totalIncome += amount;
            if (isDebit) {
                if ((entry.category || '').toLowerCase().trim() === 'profit') {
                    profitPayout += amount;
                } else {
                    operationalExpense += amount;
                }
                totalExpense += amount;
            }

            // Row Styling
            const debitClass = isDebit ? 'text-red-700 font-medium' : 'text-slate-300';
            const creditClass = isCredit ? 'text-green-700 font-medium' : 'text-slate-300';
            const rowBg = isCanceledStatus(entry.status) ? 'bg-slate-50 opacity-50 decoration-slice line-through' : 'hover:bg-slate-50 transition-colors';

            let actionBtnHtml = '-';
            if (entry.raw && entry.dataType) {
                const encodedRaw = encodeURIComponent(JSON.stringify(entry.raw).replace(/'/g, "\\'"));
                // The shopPrefix is already available in scope (from arguments: `shop`)
                actionBtnHtml = `<button onclick="openEditModal('${encodedRaw}', '${entry.dataType}', '${shop}')" class="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 bg-indigo-50 px-2 py-1 rounded">Edit</button>`;
            }

            rowsHtml += `
                <tr class="${rowBg}">
                    <td class="px-6 py-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${entry.category || 'General'}
                        </span>
                    </td>
                    <td class="px-6 py-3 text-slate-600">
                        ${entry.description || '-'}
                        ${entry.billNo ? `<span class="ml-2 text-xs font-mono text-slate-400">#${entry.billNo}</span>` : ''}
                    </td>
                    <td class="px-6 py-3 text-right font-mono ${debitClass}">
                        ${isDebit ? formatCurrency(amount) : '-'}
                    </td>
                    <td class="px-6 py-3 text-right font-mono ${creditClass}">
                        ${isCredit ? formatCurrency(amount) : '-'}
                    </td>
                    <td class="px-6 py-3 text-center">
                        ${actionBtnHtml}
                    </td>
                </tr>
            `;
        });
    }

    const closingBalance = openingBalance + totalIncome - totalExpense;

    return { totalIncome, totalExpense, operationalExpense, profitPayout, closingBalance, rowsHtml };
}

/**
 * Change Date Helper
 */
function changeLedgerDate(shop, currentDate, days) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);

    // Format YYYY-MM-DD
    const newDate = date.toLocaleDateString('en-CA');
    renderDailyLedger(shop, newDate);
}


/**
 * ADJUSTMENT MODAL LOGIC
 */
function showAdjustmentModal(shop, date, currentShort, currentExtra) {
    // Create or get modal
    let modal = document.getElementById('adjustmentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adjustmentModal';
        modal.className = 'fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 backdrop-blur-sm hidden';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 p-6">
            <h3 class="text-xl font-bold text-slate-800 mb-2">Adjust Cash Balance</h3>
            <p class="text-sm text-slate-500 mb-6">Date: <span class="font-semibold text-slate-700">${date}</span></p>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Short Cash (Money Missing)</label>
                    <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">AED</span>
                        </div>
                        <input type="number" id="adjShortInput" value="${currentShort || ''}" class="focus:ring-red-500 focus:border-red-500 block w-full pl-12 pr-4 sm:text-sm border-gray-300 rounded-md py-2" placeholder="0.00">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Extra Cash (Money Found)</label>
                    <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm">AED</span>
                        </div>
                        <input type="number" id="adjExtraInput" value="${currentExtra || ''}" class="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-4 sm:text-sm border-gray-300 rounded-md py-2" placeholder="0.00">
                    </div>
                </div>
            </div>

            <div class="mt-8 flex justify-end gap-3">
                 <button onclick="closeAdjustmentModal()" class="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                 <button onclick="adjustDailyCash('${shop}', '${date}')" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-all transform active:scale-95">Save Adjustments</button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeAdjustmentModal() {
    const modal = document.getElementById('adjustmentModal');
    if (modal) modal.classList.add('hidden');
}

async function adjustDailyCash(shop, date) {
    const shortVal = parseFloat(document.getElementById('adjShortInput').value) || 0;
    const extraVal = parseFloat(document.getElementById('adjExtraInput').value) || 0;

    try {
        const url = `${BASE_URL}/api/${shop}/ledger/adjustment`;
        const token = localStorage.getItem('authToken');

        const amount = extraVal - shortVal; // Combine short and extra into a single amount
        const note = `Adj: ${extraVal > 0 ? 'Extra ' + extraVal : ''} ${shortVal > 0 ? 'Short ' + shortVal : ''}`.trim();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ date, amount, note })
        });

        if (!response.ok) throw new Error(await response.text());

        // Clear Cache
        if (state.allResults) {
            delete state.allResults[`${shop}|daily_ledger|${date}`];
        }

        closeAdjustmentModal();
        renderDailyLedger(shop, date); // Reload

        // Show Toast
        alert("Adjustments Saved Successfully!");

    } catch (err) {
        alert("Failed to save adjustments: " + err.message);
    }
}

/**
 * Load History for Bottom Table
 */
async function loadLedgerHistory(shop, currentDate) {
    const historyContainer = document.getElementById('ledgerHistoryContainer');
    if (!historyContainer) return;

    try {
        const url = `${BASE_URL}/api/${shop}/ledger/history?date=${currentDate}`;
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error("Failed");

        const historyData = await response.json();

        if (historyData.length === 0) {
            historyContainer.innerHTML = 'No history available.';
            return;
        }

        let html = `
            <div class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                         <tr>
                            <th class="px-4 py-2">Date</th>
                            <th class="px-4 py-2 text-right">Income</th>
                            <th class="px-4 py-2 text-right">Expense</th>
                            <th class="px-4 py-2 text-right">Adjust</th>
                            <th class="px-4 py-2 text-right">Closing</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
        `;

        historyData.forEach(day => {
            const netAdjust = day.adj || 0;
            const adjustClass = netAdjust > 0 ? 'text-green-600' : (netAdjust < 0 ? 'text-red-600' : 'text-slate-300');
            const dateObj = new Date(day.date);
            const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();

            const cleanDate = day.date.split('T')[0];
            html += `
                <tr class="hover:bg-slate-50 transition-colors cursor-pointer" onclick="renderDailyLedger('${shop}', '${cleanDate}')" title="View details for ${cleanDate}">
                    <td class="px-4 py-2 font-medium ${isToday ? 'text-indigo-600' : 'text-slate-600'}">
                        ${dateObj.toLocaleDateString()}
                    </td>
                    <td class="px-4 py-2 text-right text-green-700">${formatCurrency(day.income)}</td>
                    <td class="px-4 py-2 text-right text-red-700">${formatCurrency(day.expense)}</td>
                    <td class="px-4 py-2 text-right font-bold ${adjustClass}">${netAdjust !== 0 ? formatCurrency(netAdjust) : '-'}</td>
                    <td class="px-4 py-2 text-right font-bold text-slate-800">${formatCurrency(day.closing)}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        historyContainer.innerHTML = html;
        historyContainer.classList.remove('animate-pulse');

    } catch (err) {
        historyContainer.innerHTML = '<span class="text-red-400">Failed to load history.</span>';
    }
}


// Attach global functions
window.renderDailyLedger = renderDailyLedger;
window.changeLedgerDate = changeLedgerDate;
window.showAdjustmentModal = showAdjustmentModal;
window.closeAdjustmentModal = closeAdjustmentModal;
window.adjustDailyCash = adjustDailyCash;

// --- INITIAL BALANCE SETTINGS ---
window.showLedgerSettingsModal = async (shop) => {
    let modal = document.getElementById('ledgerSettingsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ledgerSettingsModal';
        modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-300';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-95 opacity-0" id="ledgerSettingsModalContent">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ledger Settings
                </h3>
                <button onclick="closeLedgerSettingsModal()" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div class="px-6 py-6 space-y-5">
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
                    Set the opening cash balance for <b>${shop}</b> as of a specific starting date. All subsequent daily balances will calculate forward from this amount.
                </div>

                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Initial Starting Cash Balance</label>
                    <div class="relative rounded-md shadow-sm">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 sm:text-sm font-medium">AED</span>
                        </div>
                        <input type="number" id="settingsInitialBalance" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-4 sm:text-sm border-gray-300 rounded-md py-2.5 transition-shadow" placeholder="0.00">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                    <input type="date" id="settingsStartDate" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2.5 transition-shadow">
                    <p class="mt-1 text-xs text-slate-500">The balance above will be applied exactly on this physical date.</p>
                </div>
            </div>

            <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                 <button onclick="closeLedgerSettingsModal()" class="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 font-medium transition-colors shadow-sm">Cancel</button>
                 <button onclick="saveLedgerSettings('${shop}')" id="saveSettingsBtn" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-all transform active:scale-95 flex items-center gap-2">
                    <span>Save Settings</span>
                 </button>
            </div>
        </div>
    `;

    // Fetch current settings to populate
    try {
        const url = `${BASE_URL}/api/${shop}/ledger/settings`;
        const token = localStorage.getItem('authToken');
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const data = await response.json();
            if (data.initialBalance !== undefined) {
                document.getElementById('settingsInitialBalance').value = data.initialBalance;
            }
            if (data.startDate) {
                document.getElementById('settingsStartDate').value = data.startDate.split('T')[0];
            } else {
                document.getElementById('settingsStartDate').value = new Date().toLocaleDateString('en-CA');
            }
        }
    } catch (err) {
        console.error("Failed to load settings:", err);
        document.getElementById('settingsStartDate').value = new Date().toLocaleDateString('en-CA');
    }

    modal.classList.remove('hidden');
    // small delay to allow display:block to apply before animating opacity
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('ledgerSettingsModalContent').classList.remove('scale-95', 'opacity-0');
    }, 10);
};

window.closeLedgerSettingsModal = () => {
    const modal = document.getElementById('ledgerSettingsModal');
    if (!modal) return;

    modal.classList.add('opacity-0');
    document.getElementById('ledgerSettingsModalContent').classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};

window.saveLedgerSettings = async (shop) => {
    const initialBalance = parseFloat(document.getElementById('settingsInitialBalance').value) || 0;
    const startDate = document.getElementById('settingsStartDate').value;
    const btn = document.getElementById('saveSettingsBtn');

    if (!startDate) {
        alert("Please select a Start Date.");
        return;
    }

    try {
        btn.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> Saving...';
        btn.disabled = true;

        const url = `${BASE_URL}/api/${shop}/ledger/settings`;
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ initialBalance, startDate })
        });

        if (!response.ok) throw new Error(await response.text());

        // Clear all ledger caches since history is entirely recalculated
        if (state.allResults) {
            Object.keys(state.allResults).forEach(key => {
                if (key.includes('daily_ledger')) {
                    delete state.allResults[key];
                }
            });
        }

        closeLedgerSettingsModal();

        // Re-render the current view
        const targetDate = document.querySelector('input[type="date"]').value || new Date().toLocaleDateString('en-CA');
        renderDailyLedger(shop, targetDate);

    } catch (err) {
        alert("Failed to save settings: " + err.message);
        btn.innerHTML = 'Save Settings';
        btn.disabled = false;
    }
};
