// --- COMPARE & TARGET DASHBOARD LOGIC ---

let compareActiveShop = ''; // State for the shop selector in Compare tab
let compareActiveYear = new Date().getFullYear(); // State for the focus year

async function renderCompareDashboard(container) {
    if (!container) return;

    // Default to the first shop if no state
    if (!compareActiveShop && SHOP_PREFIXES.length > 0) {
        compareActiveShop = SHOP_PREFIXES[0];
    }

    // Generate Year Options
    const currentYear = new Date().getFullYear();
    const startYear = 2022;
    const endYear = currentYear + 1;
    let yearOptions = '';
    for (let y = endYear; y >= startYear; y--) {
        yearOptions += `<option value="${y}" ${y === Number(compareActiveYear) ? 'selected' : ''}>${y}</option>`;
    }

    const shopOptions = SHOP_PREFIXES.map(shop =>
        `<option value="${shop}" ${shop === compareActiveShop ? 'selected' : ''}>${shop}</option>`
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
                        <p class="mt-2 text-slate-400 text-lg">Analyze performance trends and set strategic goals.</p>
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
                            <label class="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Focus Year</label>
                            <div class="relative">
                                <select id="compareYearSelect" onchange="updateCompareYear(this.value)" 
                                    class="appearance-none bg-slate-800/50 backdrop-blur border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-32 p-3 hover:bg-slate-700/50 transition-colors cursor-pointer"
                                >
                                    ${yearOptions}
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

async function updateCompareShop(shop) {
    compareActiveShop = shop;
    await loadCompareData(shop);
}

async function updateCompareYear(year) {
    compareActiveYear = Number(year);
    await loadCompareData(compareActiveShop);
}

async function loadCompareData(shop) {
    const contentDiv = document.getElementById('compareContent');
    if (!contentDiv) return;

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/analytics/compare?shop=${shop}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server Error ${response.status}`);
        }

        const data = await response.json();
        renderComparisonTable(data, contentDiv, shop, compareActiveYear);

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

function renderComparisonTable(data, container, shop, focusYear) {
    const actuals = data.actuals || {};
    const targets = data.targets || {};

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Determine years to show: 2022 -> FocusYear
    const startYear = 2022;
    const yearsToRender = [];
    for (let y = startYear; y <= focusYear; y++) {
        yearsToRender.push(y);
    }

    // Initialize Totals
    const totals = {};
    yearsToRender.forEach(y => totals[y] = 0);
    totals['target'] = 0;

    // Build Table Header
    let headerHtml = '';
    yearsToRender.forEach(year => {
        const isFocus = year === focusYear;
        // Styling: Historic years are muted. Focus year is vibrant.
        const classes = isFocus
            ? "px-6 py-4 text-right text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 border-b-2 border-teal-200"
            : "px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100";
        headerHtml += `<th scope="col" class="${classes}">${year}</th>`;
    });

    let rowsHtml = '';
    months.forEach((monthName, index) => {
        // Build Row Cells
        let rowCellsHtml = '';
        yearsToRender.forEach(year => {
            const val = actuals[year] ? (actuals[year][index] || 0) : 0;
            totals[year] += val;

            const isFocus = year === focusYear;
            const styleClass = isFocus
                ? 'bg-teal-50/30 font-bold text-slate-800 ring-1 ring-teal-500/10' // Active column
                : 'text-slate-500';

            const displayVal = val === 0 ? '<span class="text-slate-300 font-light">–</span>' : formatCurrency(val);
            rowCellsHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm ${styleClass} text-right transition-all duration-200">${displayVal}</td>`;
        });

        const focusYearActual = actuals[focusYear] ? (actuals[focusYear][index] || 0) : 0;

        // Target Logic
        let targetVal = 0;
        let isAutoTarget = false;

        if (targets[focusYear] && typeof targets[focusYear][index] !== 'undefined') {
            targetVal = targets[focusYear][index];
        } else {
            const fallbackYear = focusYear - 1;
            if (actuals[fallbackYear] && typeof actuals[fallbackYear][index] !== 'undefined') {
                targetVal = actuals[fallbackYear][index];
                isAutoTarget = true;
            }
        }
        totals['target'] += targetVal;

        // Calc Percentage
        let percent = 0;
        if (targetVal > 0) {
            percent = (focusYearActual / targetVal) * 100;
        }

        // Color coding & Progress Bar
        let colorClass = "bg-slate-500";
        if (percent >= 100) colorClass = "bg-emerald-500";
        else if (percent >= 80) colorClass = "bg-amber-400";
        else if (percent > 0) colorClass = "bg-rose-500";

        // Capped width for bar
        const width = Math.min(percent, 100);

        const inputVal = targetVal > 0 ? targetVal : '';

        rowsHtml += `
            <tr class="hover:bg-slate-50/80 transition-all duration-200 group border-b border-slate-50 last:border-0">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">${monthName}</td>
                ${rowCellsHtml}
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right relative">
                     <input 
                        type="number" 
                        value="${inputVal}"
                        placeholder="Set Target"
                        onchange="saveTarget('${shop}', ${focusYear}, ${index}, this.value)"
                        class="block w-32 ml-auto text-right px-3 py-1.5 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-slate-900 font-medium text-sm transition-all shadow-sm group-hover:shadow-md ${isAutoTarget ? 'bg-slate-50/50 text-slate-400' : 'bg-white'}"
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
    yearsToRender.forEach(year => {
        const isFocus = year === focusYear;
        // High Contrast Styles for Footer
        const styleClass = isFocus ? 'text-teal-300 bg-slate-800' : 'text-slate-400';
        totalCellsHtml += `<td class="px-6 py-5 whitespace-nowrap text-base font-bold ${styleClass} text-right">${formatCurrency(totals[year])}</td>`;
    });

    let totalPercent = 0;
    if (totals.target > 0) totalPercent = (totals[focusYear] / totals.target) * 100;
    let totalColorClass = "bg-slate-500";
    if (totalPercent >= 100) totalColorClass = "bg-emerald-500";
    else if (totalPercent >= 80) totalColorClass = "bg-amber-400";
    else totalColorClass = "bg-rose-500";

    const totalsRow = `
        <tr class="bg-slate-900 border-t-[10px] border-white shadow-2xl relative z-10 text-white">
            <td class="px-6 py-5 whitespace-nowrap text-sm font-black text-slate-100 uppercase tracking-widest pl-8">Yearly Total</td>
            ${totalCellsHtml}
            <td class="px-6 py-5 whitespace-nowrap text-base font-black text-white text-right tracking-wide">${formatCurrency(totals.target)}</td>
            <td class="px-6 py-5 whitespace-nowrap">
                <div class="flex items-center gap-3 w-40">
                    <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-600">
                        <div class="h-full ${totalColorClass} rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" style="width: ${Math.min(totalPercent, 100)}%"></div>
                    </div>
                    <span class="text-xs font-black text-white w-12 text-right text-shadow">${totals.target > 0 ? totalPercent.toFixed(1) + '%' : '–'}</span>
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
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider">Month</th>
                            ${headerHtml}
                            <th scope="col" class="px-6 py-4 text-right text-xs font-extrabold text-slate-800 uppercase tracking-wider">Target</th>
                            <th scope="col" class="px-6 py-4 text-left text-xs font-extrabold text-slate-800 uppercase tracking-wider w-40">Performance</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50">
                        ${rowsHtml}
                        ${totalsRow}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Format Helper
function formatCurrency(amount) {
    return amount.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 });
}

async function saveTarget(shop, year, month, amount) {
    const token = localStorage.getItem('authToken');
    const val = parseFloat(amount);
    try {
        const response = await fetch(`${BASE_URL}/api/targets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ shop, year, month, amount: val })
        });
        if (response.ok) loadCompareData(shop);
    } catch (e) { console.error(e); }
}
