/**
 * Renders the Daily Ledger View mimicking a cash book.
 * @param {string} shopPrefix 
 */
async function renderDailyLedger(shopPrefix, forcedDate = null) {
    const container = document.getElementById('dataTypeContentContainer');
    // Default to today in YYYY-MM-DD format (local time)
    let targetDate = forcedDate;
    if (!targetDate) {
        targetDate = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
    }

    // --- INSTANT PREVIEW CHECK ---
    const cacheKey = `${shopPrefix}|daily_ledger|${targetDate}`;
    if (typeof allResults !== 'undefined' && allResults[cacheKey]) {
        renderDailyLedgerUI(container, shopPrefix, targetDate, allResults[cacheKey].data, allResults[cacheKey].history);
        return;
    }

    container.innerHTML = '<div class="text-center py-10"><div class="loader inline-block"></div><p class="mt-2 text-slate-500">Loading Daily Ledger...</p></div>';

    try {
        const url = `${BASE_URL}/api/${shopPrefix}/daily_ledger?date=${targetDate}`;
        const historyUrl = `${BASE_URL}/api/${shopPrefix}/ledger/history?date=${targetDate}`;

        const [dayRes, historyRes] = await Promise.all([
            fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }),
            fetch(historyUrl, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
        ]);

        if (!dayRes.ok) throw new Error("Failed to fetch daily data");
        if (!historyRes.ok) throw new Error("Failed to fetch history");

        const data = await dayRes.json();
        const historyData = await historyRes.json();

        // Calculate historical balances moving backwards from today's opening balance
        let currentRefBalance = data.openingBalance || 0;
        const processedHistory = historyData.map((row, index) => {
            // The first record in history is today (usually index 0)
            // But let's be safe and just calculate backwards for all
            if (index === 0) {
                row.opening = data.openingBalance;
                row.closing = data.closingBalance;
            } else {
                // Moving backwards: Opening(n) = Opening(n+1) - Cash(n) + Expense(n) - Adj(n)
                // Wait, if history[0] is today, then history[1] is yesterday.
                // Opening(today) = Closing(yesterday)
                // Closing(yesterday) = Opening(yesterday) + Cash(yesterday) - Expense(yesterday) + Adj(yesterday)
                // So Opening(yesterday) = Closing(yesterday) - Cash(yesterday) + Expense(yesterday) - Adj(yesterday)

                row.closing = currentRefBalance;
                row.opening = row.closing - (row.cash || 0) + (row.expense || 0) - (row.adj || 0);
            }
            currentRefBalance = row.opening;
            return row;
        });

        // Render UI
        renderDailyLedgerUI(container, shopPrefix, targetDate, data, processedHistory);

        // --- CACHE FOR INSTANT RE-VISIT ---
        if (typeof allResults !== 'undefined') {
            allResults[cacheKey] = { data, history: processedHistory };
        }

    } catch (error) {
        console.error("Daily Ledger Render Error:", error);

        const isSessionError = error.message.includes("Session Expired");

        container.innerHTML = `
            <div class="p-6 bg-red-100 text-red-800 rounded-xl shadow border border-red-300">
                <p class="font-bold">Error loading daily ledger:</p>
                <p class="font-mono text-sm mt-2">${error.message}</p>
                ${isSessionError
                ? `<button onclick="logout()" class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm">Logout & Login</button>`
                : `<button onclick="renderDailyLedger('${shopPrefix}')" class="mt-4 px-4 py-2 bg-red-200 hover:bg-red-300 rounded-lg text-sm font-semibold">Retry</button>`
            }
            </div>`;
    }
}

function renderDailyLedgerUI(container, shopPrefix, dateStr, data, history = []) {
    const {
        openingBalance,
        deliveryBreakdown,
        totalDelivery,
        totalCashDelivery,
        totalExpense,
        closingBalance,
        grossBooking,
        hasSettings,
        startDate,
        adjustment // { amount, note }
    } = data;

    const adjAmount = adjustment ? (adjustment.amount || 0) : 0;
    const totalInflow = openingBalance + totalCashDelivery;

    // Helper for Currency
    const fmt = (n) => formatCurrency(n);

    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-8 pb-20">
            <!-- Header / Date Picker -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800 tracking-tight">
                            Daily Ledger: <span class="text-indigo-600">${new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </h2>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cash-on-Hand Tracking</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <button onclick="openLedgerSettingsModal('${shopPrefix}')" 
                                class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors border border-slate-200">
                            ⚙️ Setup
                        </button>
                        <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                             <input type="date" id="ledgerDateInput" value="${dateStr}" 
                                class="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 text-slate-700">
                            <button onclick="refreshLedger('${shopPrefix}')"
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95">
                                GO
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- LEFT/MIDDLE: Main Ledger -->
                <div class="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div class="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
                        <div class="flex items-center gap-2">
                            <span class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs">💸</span>
                            <h3 class="font-black uppercase tracking-tighter">Cash Calculation</h3>
                        </div>
                        <span class="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-white/60 tracking-widest">CASHBOOK</span>
                    </div>
                    
                    <div class="p-8 lg:p-10 space-y-6">
                        <!-- Opening Balance -->
                        <div class="flex justify-between items-center pb-4 border-b border-slate-100">
                            <span class="text-slate-400 font-bold text-sm uppercase tracking-tight">Balance B/F (Opening)</span>
                            <span class="font-black text-slate-800 text-xl">${fmt(openingBalance)}</span>
                        </div>

                        <!-- Cash Delivery -->
                        <div class="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div class="flex flex-col">
                                <span class="text-slate-400 font-bold text-sm uppercase tracking-tight">Today's Cash Delivery</span>
                            </div>
                             <span class="font-black text-emerald-600 text-xl">+ ${fmt(totalCashDelivery)}</span>
                        </div>

                        <!-- Subtotal -->
                         <div class="flex justify-between items-center py-4 bg-slate-50/50 px-4 -mx-4 border-y border-slate-100/50">
                            <span class="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Liquidity</span>
                            <span class="font-black text-slate-900 text-lg">${fmt(totalInflow)}</span>
                        </div>

                        <!-- Expense -->
                        <div class="flex justify-between items-center pb-4 border-b border-slate-100">
                            <span class="text-slate-400 font-bold text-sm uppercase tracking-tight">Daily Total Expenses</span>
                             <span class="font-black text-rose-600 text-xl">- ${fmt(totalExpense)}</span>
                        </div>

                        <!-- Adjustment Section -->
                        <div class="flex justify-between items-center pb-4 border-b border-slate-100 group">
                            <div class="flex flex-col">
                                <span class="text-slate-400 font-bold text-sm uppercase tracking-tight">Adjustment (Short/Extra)</span>
                                <button onclick="openAdjustmentModal('${shopPrefix}', '${dateStr}', ${adjAmount}, '${(adjustment && adjustment.note) || ''}')" 
                                        class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-1 hover:text-indigo-700 flex items-center gap-1">
                                    ${adjAmount === 0 ? '➕ Add Adjustment' : '✏️ Edit Adjustment'}
                                </button>
                            </div>
                             <span class="font-black ${adjAmount < 0 ? 'text-amber-600' : 'text-indigo-600'} text-xl">
                                ${adjAmount >= 0 ? '+' : ''}${fmt(adjAmount)}
                             </span>
                        </div>

                        <!-- Closing Balance -->
                         <div class="pt-6">
                            <div class="bg-indigo-600 px-8 py-6 rounded-3xl shadow-2xl shadow-indigo-200/50 flex justify-between items-center">
                                <div class="flex flex-col">
                                    <span class="text-indigo-100 font-black text-xs uppercase tracking-widest mb-1">Closing Balance (Cash-on-Hand)</span>
                                    <p class="text-[10px] text-indigo-200 font-medium">Auto-carries to tomorrow's opening</p>
                                </div>
                                <span class="font-black text-white text-4xl tracking-tighter">${fmt(closingBalance)}</span>
                            </div>
                         </div>

                         <!-- Booking Info -->
                         <div class="flex justify-between items-center pt-4 text-slate-400">
                            <span class="text-[10px] font-bold uppercase tracking-widest">Daily Gross Booking (Ref Only)</span>
                            <span class="font-bold text-sm">${fmt(grossBooking)}</span>
                         </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: Delivery Summaries -->
                <div class="space-y-8">
                    <div class="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                        <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 class="font-black text-slate-700 text-xs uppercase tracking-widest">Type Breakdown</h3>
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">ALL DATA</span>
                        </div>
                        <div class="p-6">
                            <table class="w-full">
                                <tbody class="divide-y divide-slate-100">
                                    ${renderDeliveryRows(deliveryBreakdown)}
                                    
                                    <tr class="font-bold">
                                        <td class="py-4 text-slate-800 text-xs uppercase tracking-widest">Grand Total</td>
                                         <td class="py-4 text-right font-black text-slate-900 text-lg">${fmt(totalDelivery)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-lg">💡</span>
                            <h4 class="text-xs font-black text-amber-800 uppercase tracking-tight">Ledger Logic</h4>
                        </div>
                        <p class="text-[10px] text-amber-700 font-bold uppercase tracking-widest leading-loose">
                            - **CASH** stays in shop.
                            - **CARDS/ADIB** go to bank.
                            - **ATM** goes to owner/bank.
                            Only **CASH** affects your daily closing balance.
                        </p>
                    </div>
                </div>
            </div>

            <!-- 30-DAY AUTOMATED HISTORY TABLE -->
            <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                <div class="bg-slate-900 px-8 py-6 flex justify-between items-center">
                    <div>
                        <h3 class="text-white font-black uppercase tracking-tighter text-lg">30-Day Automated History</h3>
                        <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Rolling historical balance check</p>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-indigo-400 font-black text-xl tracking-tighter">${history.length}</span>
                        <span class="text-slate-600 text-[8px] font-bold uppercase tracking-widest">RECORDS</span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr class="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th class="px-8 py-4">Date</th>
                                <th class="px-4 py-4">Opening</th>
                                <th class="px-4 py-4">Cash Delivery</th>
                                <th class="px-4 py-4">Expense</th>
                                <th class="px-4 py-4">Adjustment</th>
                                <th class="px-8 py-4 text-right">Closing (Cash)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${history.map(row => `
                                <tr class="hover:bg-slate-50/80 transition-colors group cursor-pointer ${row.inactive ? 'opacity-30' : ''}" 
                                    onclick="refreshWithDate('${shopPrefix}', '${row.date}')">
                                    <td class="px-8 py-4">
                                        <div class="flex flex-col">
                                            <span class="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">${new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                            <span class="text-[8px] text-slate-400 font-bold uppercase">${new Date(row.date).toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4 text-xs font-bold text-slate-600 tracking-tight">${row.opening === 0 && row.inactive ? '-' : fmt(row.opening)}</td>
                                    <td class="px-4 py-4 text-xs font-bold text-emerald-600 tracking-tight">+${fmt(row.cash)}</td>
                                    <td class="px-4 py-4 text-xs font-bold text-rose-500 tracking-tight">-${fmt(row.expense)}</td>
                                    <td class="px-4 py-4 text-xs font-bold ${row.adj < 0 ? 'text-amber-500' : 'text-indigo-500'} tracking-tight">
                                        ${row.adj === 0 ? '-' : (row.adj > 0 ? '+' : '') + fmt(row.adj)}
                                    </td>
                                    <td class="px-8 py-4 text-right">
                                        <span class="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all text-sm font-black text-slate-900 shadow-sm">
                                            ${row.closing === 0 && row.inactive ? '-' : fmt(row.closing)}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ADJUSTMENT MODAL -->
        <div id="adjustmentModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
                <div class="bg-indigo-600 p-6 flex justify-between items-center">
                    <h3 class="text-white font-black uppercase tracking-tight">Record Adjustment</h3>
                    <button onclick="closeAdjustmentModal()" class="text-white/60 hover:text-white">✕</button>
                </div>
                <div class="p-8 space-y-6">
                    <p class="text-xs text-slate-400 font-bold uppercase leading-relaxed">
                        Enter a negative amount for **Shortage** (e.g. -100) and a positive amount for **Extra Cash** (e.g. +50).
                    </p>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Amount (AED)</label>
                        <input type="number" id="adjAmountInput" placeholder="0.00" 
                               class="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50 text-3xl font-black outline-none transition-all">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Note / Reason</label>
                        <input type="text" id="adjNoteInput" placeholder="Optional notes..." 
                               class="w-full px-6 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50 text-sm font-bold outline-none transition-all">
                    </div>
                    <button onclick="saveLedgerAdjustment('${shopPrefix}', '${dateStr}')" 
                            class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 uppercase tracking-widest">
                        Save Adjustment
                    </button>
                </div>
            </div>
        </div>
        
        <!-- SETTINGS MODAL (LEGACY) -->
        <div id="ledgerSettingsModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all">
                <div class="bg-indigo-600 p-6 flex justify-between items-center text-white">
                    <h3 class="font-black uppercase tracking-tight">Set Starting Balance</h3>
                    <button onclick="closeLedgerSettingsModal()" class="text-white/60 hover:text-white">✕</button>
                </div>
                <div class="p-8 space-y-6">
                    <div>
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Starting Cash Balance</label>
                        <input type="number" id="initBalanceInput" placeholder="0.00" 
                               class="w-full px-4 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50 text-2xl font-black outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Start Recording From</label>
                        <input type="date" id="initDateInput" 
                               class="w-full px-4 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50 font-bold outline-none">
                    </div>
                    <button onclick="saveLedgerSettings('${shopPrefix}')" 
                            class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest">
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderDeliveryRows(breakdown) {
    if (!breakdown || Object.keys(breakdown).length === 0) {
        return '<tr><td colspan="2" class="py-4 text-center text-slate-400 italic">No deliveries today</td></tr>';
    }

    // Force specific order if present: ATM, ADIB, CASH, Others
    const order = ['ATM', 'ADIB', 'CASH'];
    const keys = Object.keys(breakdown);

    // Sort keys: defined first, then others alphabetically
    keys.sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
    });

    return keys.map(key => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-2 text-slate-600 font-medium">${key} Delivery</td>
            <td class="py-2 text-right font-bold text-slate-700">${formatCurrency(breakdown[key])}</td>
        </tr>
    `).join('');
}


async function openLedgerSettingsModal(shopPrefix) {
    const modal = document.getElementById('ledgerSettingsModal');
    const initBalanceInput = document.getElementById('initBalanceInput');
    const initDateInput = document.getElementById('initDateInput');

    modal.classList.remove('hidden');

    // Fetch current settings
    try {
        const response = await fetch(`${BASE_URL}/api/${shopPrefix}/ledger/settings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (response.ok) {
            const settings = await response.json();
            if (settings) {
                initBalanceInput.value = settings.initialBalance || 0;
                if (settings.startDate) {
                    initDateInput.value = new Date(settings.startDate).toISOString().split('T')[0];
                }
            }
        }
    } catch (error) {
        console.error("Failed to fetch settings:", error);
    }
}

function closeLedgerSettingsModal() {
    document.getElementById('ledgerSettingsModal').classList.add('hidden');
}

async function saveLedgerSettings(shopPrefix) {
    const initialBalance = document.getElementById('initBalanceInput').value;
    const startDate = document.getElementById('initDateInput').value;

    if (initialBalance === '' || !startDate) {
        alert("Please fill in both fields.");
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}/api/${shopPrefix}/ledger/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ initialBalance, startDate })
        });

        if (!response.ok) throw new Error("Failed to save settings");

        // --- CLEAR CACHE ON SETTINGS CHANGE ---
        if (typeof allResults !== 'undefined') {
            Object.keys(allResults).forEach(key => {
                if (key.includes('|daily_ledger|')) delete allResults[key];
            });
        }

        closeLedgerSettingsModal();
        // Refresh the ledger view for the current date
        renderDailyLedger(shopPrefix);
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        showLoading(false);
    }
}

function openAdjustmentModal(shopPrefix, date, currentAmount, currentNote) {
    document.getElementById('adjustmentModal').classList.remove('hidden');
    document.getElementById('adjAmountInput').value = currentAmount || '';
    document.getElementById('adjNoteInput').value = currentNote || '';
}

function closeAdjustmentModal() {
    document.getElementById('adjustmentModal').classList.add('hidden');
}

async function saveLedgerAdjustment(shopPrefix, date) {
    const amount = document.getElementById('adjAmountInput').value;
    const note = document.getElementById('adjNoteInput').value;

    if (amount === '') {
        alert("Please enter an amount.");
        return;
    }

    showLoading(true);
    try {
        const response = await fetch(`${BASE_URL}/api/${shopPrefix}/ledger/adjustment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ date, amount, note })
        });

        if (!response.ok) throw new Error("Failed to save adjustment");

        // --- CLEAR CACHE ON ADJUSTMENT ---
        if (typeof allResults !== 'undefined') {
            delete allResults[`${shopPrefix}|daily_ledger|${date}`];
        }

        closeAdjustmentModal();
        renderDailyLedger(shopPrefix, date); // Refresh everything
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        showLoading(false);
    }
}

function refreshWithDate(shopPrefix, date) {
    renderDailyLedger(shopPrefix, date);
}

function refreshLedger(shopPrefix) {
    const dateInput = document.getElementById('ledgerDateInput');
    if (dateInput && dateInput.value) {
        renderDailyLedger(shopPrefix, dateInput.value);
    }
}
