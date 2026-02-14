import { SHOP_PREFIXES, ISLAMIC_CYCLES, BASE_URL } from './config.js';
import { formatCurrency } from './utils.js';

// --- COMPARE & TARGET DASHBOARD LOGIC ---

let compareActiveShop = ''; // State for the shop selector in Compare tab
let compareActiveCycleId = ''; // State for the focus cycle (e.g., '2024-2025')

export async function renderCompareDashboard(container) {
    if (!container) return;

    // Default to the first shop if no state
    if (!compareActiveShop && SHOP_PREFIXES.length > 0) {
        compareActiveShop = SHOP_PREFIXES[0];
    }

    // Default to current cycle if no state
    if (!compareActiveCycleId && typeof ISLAMIC_CYCLES !== 'undefined') {
        // Find cycle containing today
        const today = new Date().toISOString().split('T')[0];
        const current = ISLAMIC_CYCLES.find(c => today >= c.start && today <= c.end);
        compareActiveCycleId = current ? current.id : ISLAMIC_CYCLES[0].id;
    }

    // Generate Shop Options
    const shopOptions = SHOP_PREFIXES.map(shop =>
        `<option value="${shop}" ${shop === compareActiveShop ? 'selected' : ''}>${shop}</option>`
    ).join('');

    // Generate Cycle Options
    // Sort descending by start date (newest first)
    const sortedCycles = [...ISLAMIC_CYCLES].sort((a, b) => b.start.localeCompare(a.start));
    const cycleOptions = sortedCycles.map(c =>
        `<option value="${c.id}" ${c.id === compareActiveCycleId ? 'selected' : ''}>${c.label}</option>`
    ).join('');

    container.innerHTML = `
        <div class="space-y-8 animate-fade-in-up">
            <!-- Hero Header with Controls -->
            <div class="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 text-white">
                <!-- Background Pattern -->
                <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                <div class="relative z-10 flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <h2 class="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-emerald-400">Target & Growth</h2>
                        <p class="mt-2 text-slate-400 text-lg">Analyze performance by Business Year (Bakra Eid Cycles).</p>
                    </div>

                    <div class="flex flex-wrap gap-4">
                        <!-- Shop Selector -->
                        <div class="group">
                            <label class="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Select Shop</label>
                            <div class="relative">
                                <select id="compareShopSelect" onchange="updateCompareShop(this.value)" 
                                    class="appearance-none bg-slate-800/50 backdrop-blur border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-48 p-3 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    ${shopOptions}
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Year Selector -->
                        <div class="group">
                            <label class="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Focus Business Year</label>
                            <div class="relative">
                                <select id="compareYearSelect" onchange="updateCompareCycle(this.value)" 
                                    class="appearance-none bg-slate-800/50 backdrop-blur border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-40 p-3 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    ${cycleOptions}
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Area (Loader / Table) -->
            <div id="compareContent" class="min-h-[400px]">
                <div class="flex justify-center items-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            </div>
        </div>
    `;

    // Fetch and Render Data
    await loadCompareData(compareActiveShop);
}

// Ensure these functions are globally available for the onchange handlers
window.updateCompareShop = async function (shop) {
    compareActiveShop = shop;
    await loadCompareData(shop);
};

window.updateCompareCycle = async function (cycleId) {
    compareActiveCycleId = cycleId;
    await loadCompareData(compareActiveShop);
};

async function loadCompareData(shop) {
    const contentDiv = document.getElementById('compareContent');
    if (!contentDiv) return;

    try {
        const token = localStorage.getItem('authToken');
        // We still fetch grouped actuals from backend
        // Ideally we'd optimize this to not fetch EVERYTHING, but for now it's fine
        const response = await fetch(`${BASE_URL}/api/analytics/compare?shop=${shop}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server Error ${response.status}`);
        }

        const data = await response.json();
        renderComparisonTable(data, contentDiv, shop, compareActiveCycleId);

    } catch (error) {
        console.error("Compare Data Error:", error);
        contentDiv.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p class="font-medium">Error loading data: ${error.message}</p>
            </div>
        `;
    }
}

function renderComparisonTable(data, container, shop, focusCycleId) {
    const actuals = data.actuals || {}; // { 2024: { 0: val, ... }, ... }
    const targets = data.targets || {}; // { 2024: { 0: val, ... }, ... }

    // 1. Identify Cycles to Render
    // We want the Focus Cycle and previous cycles (e.g. 3 years back)
    // Find index of focus cycle
    const sortedCycles = [...ISLAMIC_CYCLES].sort((a, b) => a.start.localeCompare(b.start)); // Ascending time
    const focusIndex = sortedCycles.findIndex(c => c.id === focusCycleId);

    // We want to show maybe 3 columns: Focus, Focus-1, Focus-2 (if available)
    // Or simpler: Show all defined cycles up to Focus?
    // Let's show Focus and Previous 2.
    const startIndex = Math.max(0, focusIndex - 2);
    const cyclesToShow = sortedCycles.slice(startIndex, focusIndex + 1);

    // 2. Prepare Cycle Data (Map Gregorian months to Cycle Months)
    // We'll look at the first 12 months starting from the 'start' month of the cycle.

    // Helper to get value from {Year: {MonthIndex: Val}}
    const getVal = (source, date) => {
        const y = date.getFullYear();
        const m = date.getMonth(); // 0-11
        if (source[y] && source[y][m] !== undefined) return source[y][m];
        return 0;
    };

    // Columns
    const columns = cyclesToShow.map(cycle => {
        return {
            id: cycle.id,
            label: cycle.label,
            startDate: new Date(cycle.start),
            isFocus: cycle.id === focusCycleId
        };
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Rows: 1 to 12
    const rows = [];
    for (let i = 0; i < 12; i++) {
        const rowData = {
            index: i,
            cells: []
        };

        columns.forEach(col => {
            // Calculate specific month for this cycle + i
            // Logic: Month 0 = Month of Start Date
            const d = new Date(col.startDate);
            d.setMonth(d.getMonth() + i); // Add months

            const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

            const actualVal = getVal(actuals, d);
            const targetVal = getVal(targets, d); // Gregorian target

            rowData.cells.push({
                cycleId: col.id,
                actual: actualVal,
                target: targetVal,
                date: d,
                monthLabel
            });
        });
        rows.push(rowData);
    }

    // Totals logic
    const colTotals = {};
    columns.forEach(c => colTotals[c.id] = { actual: 0, target: 0 });

    // Build Table HTML
    let headerHtml = '';
    columns.forEach(col => {
        const classes = col.isFocus
            ? "px-6 py-4 text-right text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border-b-2 border-teal-200"
            : "px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100";
        headerHtml += `<th scope="col" class="${classes}">${col.label}</th>`;
    });

    let rowsHtml = '';
    rows.forEach((row) => {
        let cellHtml = '';

        // Find Focus Cell Data for Target/Progress logic
        const focusCell = row.cells.find(c => c.cycleId === focusCycleId);

        row.cells.forEach(cell => {
            colTotals[cell.cycleId].actual += cell.actual;

            // If target is missing for focus year, check if we can auto-fill from previous cycle?
            // Actually, saving targets is per Gregorian month. 
            // Logic: If target exists in DB, use it. If not, maybe show 0.
            if (cell.cycleId === focusCycleId) {
                colTotals[cell.cycleId].target += (cell.target || 0);
            }

            const isFocus = cell.cycleId === focusCycleId;
            const styleClass = isFocus
                ? 'bg-teal-50/30 font-bold text-slate-800 ring-1 ring-teal-500/10'
                : 'text-slate-500';

            const displayVal = cell.actual === 0 ? '<span class="text-slate-300 font-light">–</span>' : formatCurrency(cell.actual);

            cellHtml += `
                <td class="px-6 py-4 whitespace-nowrap text-sm ${styleClass} text-right transition-all duration-200 group relative">
                    ${displayVal}
                    <div class="absolute bottom-1 right-2 text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none">${cell.monthLabel}</div>
                </td>`;
        });

        // Target Input & Progress (Focus Cycle Only)
        let targetVal = focusCell ? focusCell.target || 0 : 0;
        let isAuto = false;

        // Auto-Target Logic: Use Previous Cycle's Actual if Target is 0? 
        // Let's use PREVIOUS CYCLE actual as the benchmark if no target set.
        if (targetVal === 0 && columns.length > 1) {
            // Find previous column cell
            const prevColIndex = columns.findIndex(c => c.id === focusCycleId) - 1;
            if (prevColIndex >= 0) {
                targetVal = row.cells[prevColIndex].actual;
                isAuto = true;
            }
        }

        // If we used auto-target for display, add it to totals for consistent % calc?
        // Let's standard: The "Target" column sum should match the inputs.
        // If the input is auto-filled visually, treating it as "Target" is confusing unless saved.
        // Let's only count REAL saved targets in totals for now, unless we want to project.
        // For line item progress bar, we use the effective targetVal (auto or real).

        const focusActual = focusCell ? focusCell.actual : 0;
        let percent = 0;
        if (targetVal > 0) percent = (focusActual / targetVal) * 100;

        let colorClass = "bg-slate-500";
        if (percent >= 100) colorClass = "bg-emerald-500";
        else if (percent >= 80) colorClass = "bg-amber-400";
        else if (percent > 0) colorClass = "bg-rose-500";

        const width = Math.min(percent, 100);

        // Input arguments need Gregorian Year/Month
        const gDate = focusCell ? focusCell.date : new Date();
        const gYear = gDate.getFullYear();
        const gMonthIndex = gDate.getMonth();

        const inputVal = (focusCell && focusCell.target) ? focusCell.target : '';

        // Row Label: "Month X" or simpler.
        // Let's use the Gregorain Month Name of the FOCUS year.
        const rowLabel = focusCell ? focusCell.monthLabel.split(' ')[0] : `Period ${row.index + 1}`;

        rowsHtml += `
            <tr class="hover:bg-slate-50/80 transition-all duration-200 group border-b border-slate-50 last:border-0">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">
                    ${rowLabel}
                </td>
                ${cellHtml}
                 <td class="px-6 py-4 whitespace-nowrap text-sm text-right relative">
                     <input 
                        type="number" 
                        value="${inputVal}"
                        placeholder="${isAuto ? formatCurrency(targetVal).replace('AED ', '') : 'Set'}"
                        onchange="saveTarget('${shop}', ${gYear}, ${gMonthIndex}, this.value)"
                        class="block w-32 ml-auto text-right px-3 py-1.5 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-slate-900 font-medium text-sm transition-all shadow-sm group-hover:shadow-md ${isAuto ? 'placeholder-slate-300' : 'bg-white'}"
                    >
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3 w-40">
                        <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full ${colorClass} rounded-full transition-all duration-500 ease-out" style="width: ${width}%"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-600 w-12 text-right">${percent > 0 ? percent.toFixed(0) + '%' : '–'}</span>
                    </div>
                </td>
            </tr>
        `;
    });

    // Totals Row
    let totalCellsHtml = '';
    columns.forEach(col => {
        const isFocus = col.isFocus;
        const styleClass = isFocus ? 'text-teal-300 bg-slate-800' : 'text-slate-400';
        totalCellsHtml += `<td class="px-6 py-5 whitespace-nowrap text-base font-bold ${styleClass} text-right">${formatCurrency(colTotals[col.id].actual)}</td>`;
    });

    const focusTotal = colTotals[focusCycleId].actual;
    const focusTarget = colTotals[focusCycleId].target;

    let totalPercent = 0;
    if (focusTarget > 0) totalPercent = (focusTotal / focusTarget) * 100;

    let totalColorClass = "bg-slate-500";
    if (totalPercent >= 100) totalColorClass = "bg-emerald-500";
    else if (totalPercent >= 80) totalColorClass = "bg-amber-400";
    else totalColorClass = "bg-rose-500";

    const totalsRow = `
        <tr class="bg-slate-900 border-t-[10px] border-white shadow-2xl relative z-10 text-white">
            <td class="px-6 py-5 whitespace-nowrap text-sm font-black text-slate-100 uppercase tracking-widest pl-8">Total</td>
            ${totalCellsHtml}
            <td class="px-6 py-5 whitespace-nowrap text-base font-black text-white text-right tracking-wide">${formatCurrency(focusTarget)}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-3 w-40">
                    <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-600">
                        <div class="h-full ${totalColorClass} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style="width: ${Math.min(totalPercent, 100)}%"></div>
                    </div>
                    <span class="text-xs font-black text-white w-12 text-right text-shadow">${focusTarget > 0 ? totalPercent.toFixed(1) + '%' : '–'}</span>
                </div>
            </td>
        </tr>
    `;

    const html = `
        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full tabular-nums border-collapse">
                    <thead>
                        <tr class="bg-white border-b border-slate-100">
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider min-w-[120px]">Month</th>
                            ${headerHtml}
                            <th scope="col" class="px-6 py-4 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Target</th>
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider w-40">Growth</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${rowsHtml}
                        ${totalsRow}
                    </tbody>
                </table>
            </div>
            <div class="p-4 bg-slate-50 text-xs text-slate-400 text-center">
                * Comparing months based on Business Cycle alignment. Row labels show Gregorian month for the selected Focus Year.
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Ensure globally accessible for input onchange
window.saveTarget = async function (shop, year, month, amount) {
    const token = localStorage.getItem('authToken');
    const val = parseFloat(amount);

    if (isNaN(val)) return; // Don't save invalid data

    try {
        const response = await fetch(`${BASE_URL}/api/targets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ shop, year, month, amount: val })
        });
        if (response.ok) {
            // Optional: Show toast
            loadCompareData(shop);
        }
    } catch (e) { console.error(e); }
};
