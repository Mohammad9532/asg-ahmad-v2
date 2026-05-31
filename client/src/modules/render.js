import { state } from './state.js';
import { SHOP_PREFIXES, BASE_URL } from './config.js';
import { formatCurrency, calculateCanceledSum, isCanceledStatus, sortArray, getSortIcon } from './utils.js';
import { renderMonthlySummary } from './render_monthly.js';
import { renderStockAuditView } from './stock_audit.js';
import { renderExcessDeliveryView } from './excess_delivery.js';
import { renderDailyLedger } from './dailyLedger.js';
import { renderShopCompareBookings } from './compare_bookings.js';
import { renderCompareDashboard } from './compare.js';
import { aggregateCustomers } from './customers.js';
import { renderStandardTable, renderDailyNetBookingTable, renderDailyCategoryTrendTable } from './render_tables.js';
// import { setActiveDataType } from './ui.js'; // Removed to avoid circular dependency

// --- MAIN CONTENT RENDERING & CHARTS ---

// Global chart instances to destroy before re-rendering
// We attach to window to ensure persistence across module reloads if HMR is used, though less critical here.
if (typeof window.chartInstances === 'undefined') {
    window.chartInstances = {};
}

export function renderContent(shopPrefix, dataType) {
    const container = document.getElementById('dataTypeContentContainer');
    const statusMessage = document.getElementById('statusMessage');
    const dataTypeTabs = document.getElementById('dataTypeTabsContainer');

    if (!container) return;

    // --- INSTANT PREVIEW LOGIC ---
    // If data is already in memory, skip the skeleton and render immediately
    const isSpecial = shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE' || shopPrefix === 'CUSTOMERS';
    const isGlobalLoaded = state.allResults['GLOBAL|LOADED'];
    const isShopLoaded = state.allResults[`${shopPrefix}|FULL_LOADED`];

    // We can render instantly if:
    // 1. It's a special view and global data is loaded
    // 2. It's a shop view and full shop data is loaded (except for ledger/audit which fetch own data)
    const canRenderInstantly = (isSpecial && isGlobalLoaded) || (!isSpecial && isShopLoaded);

    // Note: Daily Ledger, Stock Audit, and Excess Delivery currently fetch their own data, 
    // we'll handle their caching internally in their files.
    const isInternalFetchView = dataType === 'daily_ledger' || dataType === 'stock_audit' || dataType === 'excess_delivery';

    if (canRenderInstantly && !isInternalFetchView) {
        if (statusMessage) statusMessage.classList.add('hidden');
        renderContentSync(shopPrefix, dataType, container, statusMessage, dataTypeTabs);
        return;
    }

    // --- ASYNC LOADING PATH (Show Skeleton) ---
    container.innerHTML = '';
    const skeleton = document.getElementById('skeletonLoader');
    const skeletonDash = document.getElementById('skeletonDashboard');
    const skeletonTable = document.getElementById('skeletonTable');

    if (skeleton) {
        skeleton.classList.remove('hidden');
        if (skeletonDash) skeletonDash.classList.add('hidden');
        if (skeletonTable) skeletonTable.classList.add('hidden');

        if (dataType === 'dashboard' || isSpecial) {
            if (skeletonDash) skeletonDash.classList.remove('hidden');
        } else {
            if (skeletonTable) skeletonTable.classList.remove('hidden');
        }
    }
    if (statusMessage) statusMessage.classList.add('hidden');

    setTimeout(() => {
        if (skeleton) skeleton.classList.add('hidden');
        renderContentSync(shopPrefix, dataType, container, statusMessage, dataTypeTabs);
    }, 10);
}

function renderContentSync(shopPrefix, dataType, container, statusMessage, dataTypeTabs) {

    // Handle OVERVIEW special case
    if (shopPrefix === 'OVERVIEW') {
        if (dataTypeTabs) dataTypeTabs.classList.add('hidden'); // Hide data type tabs for Overview

        // Check if we have data to show (at least one shop fetched)
        // Heuristic: check if allResults is empty
        if (Object.keys(state.allResults).length === 0) {
            if (statusMessage) {
                statusMessage.textContent = "Welcome to the Global Overview. Please select a date range and click 'Fetch Data'.";
                statusMessage.classList.remove('hidden');
            }
            return;
        }

        renderOverviewDashboard(container);
        return;
    }

    // Handle COMPARE special case
    if (shopPrefix === 'COMPARE') {
        if (dataTypeTabs) dataTypeTabs.classList.add('hidden');
        renderCompareDashboard(container); // Defined in compare.js
        return;
    }

    // Handle CUSTOMERS special case
    if (shopPrefix === 'CUSTOMERS') {
        if (dataTypeTabs) dataTypeTabs.classList.add('hidden');
        aggregateCustomers(); // Defined in customers.js

        return;
    }

    // Standard Shop View
    if (dataTypeTabs) dataTypeTabs.classList.remove('hidden');

    // The 'monthly_summary' key is now used as a placeholder for the UI and is NOT expected in the allResults cache.
    const key = `${shopPrefix}|${dataType}`;
    const isMonthlySummaryTab = dataType === 'monthly_summary';

    // Check if core data needed for monthly summary is present
    if (isMonthlySummaryTab) {
        // We rely on 'bookings', 'delivery', and 'expense' being fetched.
        const bookingsKey = `${shopPrefix}|bookings`;
        const deliveryKey = `${shopPrefix}|delivery`;
        const expenseKey = `${shopPrefix}|expense`;

        if (!state.allResults[bookingsKey] || !state.allResults[deliveryKey] || !state.allResults[expenseKey]) {
            if (statusMessage) {
                statusMessage.textContent = `Error: Core data (Bookings, Deliveries, or Expenses) needed for the Monthly Summary is missing. Please click 'Fetch All Shop Data'.`;
                statusMessage.classList.remove('hidden');
            }
            return;
        }
        // Check if any of the core data results show an API error.
        if (state.allResults[bookingsKey].isError || state.allResults[deliveryKey].isError || state.allResults[expenseKey].isError) {
            container.innerHTML = `
                <div class="p-6 bg-red-100 text-red-800 rounded-xl shadow-lg border border-red-300">
                    <p class="font-bold">Error: Monthly Summary cannot be calculated due to API errors in core data types:</p>
                    <ul class="list-disc ml-5 mt-2 text-sm">
                        ${state.allResults[bookingsKey].isError ? `<li>Bookings: ${state.allResults[bookingsKey].errorMessage}</li>` : ''}
                        ${state.allResults[deliveryKey].isError ? `<li>Deliveries: ${state.allResults[deliveryKey].errorMessage}</li>` : ''}
                        ${state.allResults[expenseKey].isError ? `<li>Expenses: ${state.allResults[expenseKey].errorMessage}</li>` : ''}
                    </ul>
                    <p class="mt-3 text-sm font-semibold">Action: Check the backend server for these specific routes.</p>
                </div>`;
            return;
        }
    }

    const data = state.allResults[key]; // This will be undefined for monthly_summary, which is fine.

    if (dataType === 'dashboard') {
        renderShopDashboard(shopPrefix, container);
    } else if (dataType === 'bookings') {
        renderNetBookingDetails(shopPrefix, data, container);
    } else if (dataType === 'delivery') {
        renderDeliveryByTypeDetails(shopPrefix, data, container);
    } else if (dataType === 'expense') {
        renderExpenseByTypeDetails(shopPrefix, data, container);
    } else if (dataType === 'employee') {
        renderEmployeeSection(shopPrefix, container);
    } else if (isMonthlySummaryTab) {
        // Defined in render_monthly.js
        renderMonthlySummary(shopPrefix);
    } else if (dataType === 'stock_audit') {
        // Defined in stock_audit.js
        renderStockAuditView(shopPrefix);
    } else if (dataType === 'excess_delivery') {
        // Defined in excess_delivery.js
        renderExcessDeliveryView(shopPrefix);
    } else if (dataType === 'daily_ledger') {
        // Defined in dailyLedger.js
        renderDailyLedger(shopPrefix);
    } else if (dataType === 'compare_bookings') {
        // Defined in compare_bookings.js
        renderShopCompareBookings(shopPrefix);
    } else {
        // Fallback for other potential types, renders standard table
        renderStandardTable(shopPrefix, data, dataType);
    }
}

function isValidDataTypeForShop(dt) {
    return ['dashboard', 'bookings', 'delivery', 'expense', 'employees', 'monthly_summary', 'stock_audit', 'daily_ledger', 'compare_bookings', 'excess_delivery'].includes(dt);
}

// --- DASHBOARD RENDERERS ---

function renderShopDashboard(shop, container) {
    const bk = state.allResults[`${shop}|bookings`];
    const exp = state.allResults[`${shop}|expense`];
    const del = state.allResults[`${shop}|delivery`];

    // 1. Calculate Metrics
    let shopNet = 0;
    let shopGross = 0;
    let shopCancel = 0;

    if (bk && bk.filteredData) {
        shopGross = bk.filteredData.reduce((s, d) => s + (d.amount || 0), 0);
        shopCancel = calculateCanceledSum(bk.filteredData);
        shopNet = shopGross - shopCancel;
    }

    let shopExp = 0;
    let shopProfitPayout = 0;
    if (exp && exp.filteredData) {
        exp.filteredData.forEach(d => {
            const amt = d.amount || 0;
            if ((d.dept || '').toLowerCase().trim() === 'profit') {
                shopProfitPayout += amt;
            } else {
                shopExp += amt;
            }
        });
    } else if (exp) {
        // Fallback for summary-only data
        shopExp = exp.totalAmount || 0;
        shopProfitPayout = exp.profitPayout || 0;
    }

    let shopDel = 0;
    let shopBookingDel = 0;
    let shopMiscDel = 0;
    let paymentMethods = { CASH: 0, ADIB: 0, ATM: 0 };

    if (del && del.filteredData) {
        shopDel = del.filteredData.reduce((s, d) => {
            const amt = d.amount || 0;
            const bNo = (d.billNo || '').toLowerCase().trim();

            if (bNo && bNo !== 'other-amounts') {
                shopBookingDel += amt;
            } else {
                shopMiscDel += amt;
            }

            let type = d.amountType ? d.amountType.toUpperCase().trim() : 'CASH';
            if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';

            if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';

            if (paymentMethods.hasOwnProperty(type)) paymentMethods[type] += amt;
            else paymentMethods.CASH += amt;
            return s + amt;
        }, 0);
    }

    // NEW: Get Accrual Delivery Amount (Deliveries matching current bookings)
    const accrualData = state.allResults[`${shop}|accrual_delivery`];
    const accrualDeliveryAmount = accrualData ? (accrualData.totalAccrualAmount || 0) : 0;

    // Updated Formula: Profit matches this year's booking deliveries - expenses
    const profit = accrualDeliveryAmount - shopExp;
    // Updated Formula: Stock Remaining matches Net Bookings - This Year's Deliveries
    const stock = shopNet - accrualDeliveryAmount;

    // NEW: Previous Booking Collection (Booking Delivery - Accrual)
    const oldCollection = shopBookingDel - accrualDeliveryAmount;

    // NEW: Remaining Metrics for Layout
    const totalBalance = shopDel - shopExp;
    const stockPercent = shopNet > 0 ? (stock / shopNet) * 100 : 0;

    // 2. Prepare Chart Data (Daily Trend)
    const dailyMap = new Map();
    if (bk && bk.filteredData) {
        bk.filteredData.forEach(d => {
            const dateStr = new Date(d.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
            const amt = d.amount || 0;
            // Subtract if canceled
            const val = isCanceledStatus(d.status) ? -amt : amt;
            dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + val);
        });
    }
    const sortedDates = Array.from(dailyMap.keys()).sort();
    const dailyValues = sortedDates.map(k => dailyMap.get(k));


    // 3. Render HTML
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- 1. Gross -->
                <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Gross Booking</h3>
                    <p class="text-lg md:text-xl font-bold text-slate-700 mt-0.5">${formatCurrency(shopGross)}</p>
                </div>
                <!-- 2. Cancel -->
                <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <h3 class="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Cancelled</h3>
                    <p class="text-lg md:text-xl font-bold text-rose-700 mt-0.5">${formatCurrency(shopCancel)}</p>
                </div>
                <!-- 3. Net -->
                <div class="bg-indigo-50 p-3 rounded-xl shadow-sm border border-indigo-100">
                    <h3 class="text-[10px] font-bold text-indigo-800 uppercase tracking-tight">Net Booking</h3>
                    <p class="text-lg md:text-xl font-bold text-indigo-900 mt-0.5">${formatCurrency(shopNet)}</p>
                </div>
                <!-- 4. Deliveries (Accrual) -->
                <div class="bg-blue-50 p-3 rounded-xl shadow-sm border border-blue-100">
                    <h3 class="text-[10px] font-bold text-blue-800 uppercase tracking-tight">Del (Accrual)</h3>
                    <p class="text-lg md:text-xl font-bold text-blue-900 mt-0.5">${formatCurrency(accrualDeliveryAmount)}</p>
                </div>
                <!-- 5. Expenses -->
                <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Expenses</h3>
                    <p class="text-lg md:text-xl font-bold text-red-600 mt-0.5">${formatCurrency(shopExp)}</p>
                </div>
                
                <!-- 6. Profit -->
                <div class="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase">Est. Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-bold text-emerald-900">${formatCurrency(profit)}</p>
                </div>
                <!-- 6a. Total Profit Generated (New) -->
                <div class="bg-emerald-600 p-4 rounded-xl shadow-md border border-emerald-700 text-white">
                    <h3 class="text-xs font-semibold text-emerald-100 uppercase">Total Net Profit</h3>
                    <p class="text-xs text-emerald-200 mb-1">(Est. Profit + Payouts)</p>
                    <p class="text-xl font-bold">${formatCurrency(profit + shopProfitPayout)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-cyan-50 p-4 rounded-xl shadow-sm border border-cyan-100">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-bold text-cyan-900">${formatCurrency(oldCollection)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100 cursor-pointer hover:shadow-md transition-all group" 
                     onclick="viewMiscCollectionDetails('${shop}')">
                    <div class="flex justify-between items-start">
                        <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-tighter">Misc Collections</h3>
                        <svg class="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-bold text-amber-900">${formatCurrency(shopMiscDel)}</p>
                </div>
                <!-- 9. Total Balance -->
                <div class="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-bold text-indigo-900">${formatCurrency(totalBalance)}</p>
                </div>
                <!-- 10. Profit Payouts (Interactive) -->
                <div class="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 cursor-pointer hover:shadow-md transition-all group" 
                     onclick="viewProfitDetails('${shop}')">
                    <div class="flex justify-between items-start">
                        <h3 class="text-xs font-semibold text-red-800 uppercase tracking-tighter">Profit Payout</h3>
                        <svg class="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-xs text-red-600 mb-1">(Dept: Profit)</p>
                    <p class="text-xl font-bold text-red-900">${formatCurrency(shopProfitPayout)}</p>
                </div>
                <!-- 11. Stock Available -->
                <div class="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                    <h3 class="text-xs font-semibold text-teal-800 uppercase">Stock Available</h3>
                    <p class="text-xs text-teal-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-bold text-teal-900">${formatCurrency(stock)}</p>
                </div>
                <!-- 12. Stock Percentage -->
                <div class="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-bold text-purple-700">${stockPercent.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Charts Area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Daily Trend -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h4 class="font-bold text-slate-800 mb-4 text-sm tracking-tight">Daily Net Booking Trend</h4>
                    <div class="h-64 md:h-72 relative w-full">
                        <canvas id="shopTrendChart"></canvas>
                    </div>
                </div>
                <!-- Payment Methods -->
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h4 class="font-bold text-slate-800 mb-4 text-sm tracking-tight">Delivery Payment Methods</h4>
                    <div class="flex flex-col md:flex-row items-center gap-6">
                        <div class="relative w-full md:w-1/2 h-48 md:h-64 flex justify-center">
                            <canvas id="shopPaymentChart"></canvas>
                        </div>
                        <div class="w-full md:w-1/2">
                            ${renderLegendHTML(paymentMethods, shopDel)}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Monthly Summary Reuse -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 class="font-bold text-slate-800 text-sm">Monthly Summary Quick View</h3>
                        <button onclick="downloadMonthlyExcel('${shop}')" class="text-xs flex items-center bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded-lg font-medium transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel Report
                    </button>
                </div>
                <div id="dashboardMonthlyContainer" class="p-4">
                        <button onclick="setActiveDataType('monthly_summary')" class="text-teal-600 hover:text-teal-800 font-medium underline">View Full Monthly Breakdown</button>
                </div>
            </div>
        </div>
    `;

    // 4. Init Charts
    if (window.chartInstances.shopTrend) window.chartInstances.shopTrend.destroy();
    if (window.chartInstances.shopPay) window.chartInstances.shopPay.destroy();

    const ctx1 = document.getElementById('shopTrendChart').getContext('2d');
    window.chartInstances.shopTrend = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Net Booking',
                data: dailyValues,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctx2 = document.getElementById('shopPaymentChart').getContext('2d');
    window.chartInstances.shopPay = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Card/ADIB', 'ATM'],
            datasets: [{
                data: [paymentMethods.CASH, paymentMethods.ADIB, paymentMethods.ATM],
                backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderOverviewDashboard(container) {
    // 1. Calculate Aggregates
    let totalGrossBooking = 0, totalCancelBooking = 0, totalNetBooking = 0;
    let totalBookingDeliveries = 0, totalMiscDeliveries = 0, totalAccrualDeliveries = 0, totalExpenses = 0, totalProfitPayouts = 0;
    let totalDeliveries = 0; // Total of all deliveries (booking + misc)
    const shopPerformance = [];

    // For charts
    let shopNames = [];
    let shopNetValues = [];

    const paymentMethods = { CASH: 0, ADIB: 0, ATM: 0, OTHER: 0 };

    SHOP_PREFIXES.forEach(shop => {
        // Helper to get Best Data (Detailed > Summary)
        const getMetric = (type) => state.allResults[`${shop}|${type}`] || state.allResults[`${shop}|SUMMARY|${type}`];

        // Bookings Data
        const bk = getMetric('bookings');
        const shopGross = bk ? (bk.totalAmount || 0) : 0;

        let shopNet = 0;
        let shopCancel = 0;

        if (bk) {
            if (bk.netAmount !== undefined) {
                shopNet = bk.netAmount;
                shopCancel = bk.cancelAmount || 0;
            } else if (bk.filteredData) {
                shopNet = bk.filteredData.reduce((sum, doc) => sum + (isCanceledStatus(doc.status) ? 0 : (doc.amount || 0)), 0);
                shopCancel = calculateCanceledSum(bk.filteredData);
            }
        }

        totalGrossBooking += shopGross;
        totalCancelBooking += shopCancel;
        totalNetBooking += shopNet;

        // Deliveries Data
        const del = getMetric('delivery');
        let shopDel = 0;
        let shopBookingDel = 0;
        let shopMiscDel = 0;

        if (del) {
            shopDel = del.totalAmount || 0;
            if (del.paymentMethods) {
                shopBookingDel = del.bookingDel || 0;
                shopMiscDel = del.miscDel || 0;
                paymentMethods.CASH += (del.paymentMethods.CASH || 0);
                paymentMethods.ADIB += (del.paymentMethods.ADIB || 0);
                paymentMethods.ATM += (del.paymentMethods.ATM || 0);
            } else if (del.filteredData) {
                del.filteredData.forEach(d => {
                    const amt = d.amount || 0;
                    const bNo = (d.billNo || '').toLowerCase().trim();
                    if (bNo && bNo !== 'other-amounts') shopBookingDel += amt;
                    else shopMiscDel += amt;
                    let type = d.amountType ? d.amountType.toUpperCase().trim() : 'CASH';
                    if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
                    if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
                    paymentMethods[type] += amt;
                });
            }
        }

        totalDeliveries += shopDel;
        totalBookingDeliveries += shopBookingDel;
        totalMiscDeliveries += shopMiscDel;

        // Accrual Delivery Total
        const accData = getMetric('accrual_delivery');
        const shopAccDel = accData ? (accData.totalAccrualAmount || 0) : 0;
        totalAccrualDeliveries += shopAccDel;

        // Expenses (Split: Operational vs Profit)
        const exp = getMetric('expense');
        let shopExp = 0;
        let shopProfitPayout = 0;

        if (exp) {
            if (exp.filteredData && exp.filteredData.length > 0) {
                exp.filteredData.forEach(d => {
                    const amt = d.amount || 0;
                    if ((d.dept || '').toLowerCase().trim() === 'profit') {
                        shopProfitPayout += amt;
                    } else {
                        shopExp += amt;
                    }
                });
            } else {
                shopExp = exp.totalAmount || 0;
                shopProfitPayout = exp.profitPayout || 0;
            }
        }
        totalExpenses += shopExp;
        totalProfitPayouts += shopProfitPayout;

        // Lifetime Data
        const lifeData = getMetric('lifetime');
        const shopTwStock = lifeData ? (lifeData.lifetimeStock || 0) : 0;

        shopPerformance.push({
            shop,
            net: shopNet,
            gross: shopGross,
            cancel: shopCancel,
            exp: shopExp,
            del: shopDel,
            accDel: shopAccDel,
            totStock: shopTwStock
        });

        shopNames.push(shop);
        shopNetValues.push(shopNet);
    });

    // Sort performance by Net Booking DESC
    shopPerformance.sort((a, b) => b.net - a.net);

    // Calculate new metrics
    const estimateProfit = totalAccrualDeliveries - totalExpenses;
    const stockAvailable = totalNetBooking - totalAccrualDeliveries;
    const totalOldCollection = totalBookingDeliveries - totalAccrualDeliveries;
    const totalBalanceGlobal = totalDeliveries - totalExpenses;
    const totalStockPercent = totalNetBooking > 0 ? (stockAvailable / totalNetBooking) * 100 : 0;

    // 2. Render HTML
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Grand Totals Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- 1. Gross -->
                    <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Gross Booking</h3>
                    <p class="text-xl font-extrabold text-indigo-900 mt-1">${formatCurrency(totalGrossBooking)}</p>
                </div>
                <!-- 2. Cancel -->
                <div class="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm border border-red-200">
                    <h3 class="text-xs font-semibold text-red-800 uppercase tracking-wider">Cancelled</h3>
                    <p class="text-xl font-extrabold text-red-900 mt-1">${formatCurrency(totalCancelBooking)}</p>
                </div>
                <!-- 3. Net -->
                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Net Booking</h3>
                    <p class="text-xl font-extrabold text-indigo-900 mt-1">${formatCurrency(totalNetBooking)}</p>
                </div>

                <!-- 4. Stock Accrual -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Stock Available</h3>
                    <p class="text-xs text-amber-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-extrabold text-amber-900">${formatCurrency(stockAvailable)}</p>
                </div>
                <!-- 5. Stock % -->
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase tracking-wider">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-extrabold text-purple-900">${totalStockPercent.toFixed(1)}%</p>
                </div>

                <!-- 6. Deliveries Accrual -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                    <h3 class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Del (Accrual)</h3>
                    <p class="text-xs text-blue-600 mb-1">(Current Year Coll.)</p>
                    <p class="text-xl font-extrabold text-blue-900 mt-1">${formatCurrency(totalAccrualDeliveries)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl shadow-sm border border-cyan-200">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase tracking-wider">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-extrabold text-cyan-900">${formatCurrency(totalOldCollection)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200 cursor-pointer hover:shadow-md transition-all group" 
                     onclick="viewGlobalMiscCollectionDetails()">
                    <div class="flex justify-between items-start">
                        <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Misc Collections</h3>
                        <svg class="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-extrabold text-amber-900">${formatCurrency(totalMiscDeliveries)}</p>
                </div>

                <!-- 9. Expenses -->
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl shadow-sm border border-pink-200">
                    <h3 class="text-xs font-semibold text-pink-800 uppercase tracking-wider">Total Expenses</h3>
                    <p class="text-xl font-extrabold text-pink-900 mt-1">${formatCurrency(totalExpenses)}</p>
                </div>
                
                <!-- 10. Profit -->
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow-sm border border-emerald-200">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Est. Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-extrabold text-emerald-900">${formatCurrency(estimateProfit)}</p>
                </div>
                <!-- 11. Profit Payouts (Interactive) -->
                <div class="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm border border-red-200 cursor-pointer hover:shadow-md transition-all group" 
                     onclick="openGlobalProfitModal()">
                    <div class="flex justify-between items-start">
                        <h3 class="text-xs font-semibold text-red-800 uppercase tracking-wider">Profit Payouts</h3>
                        <svg class="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-xs text-red-600 mb-1">(Total Distributed)</p>
                    <p class="text-xl font-extrabold text-red-900 mt-1">${formatCurrency(totalProfitPayouts)}</p>
                </div>
                <!-- 12. Total Profit (New) -->
                <div class="bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 rounded-xl shadow-lg border border-emerald-800 text-white">
                    <h3 class="text-xs font-semibold text-emerald-100 uppercase tracking-wider">Total Net Profit</h3>
                    <p class="text-xs text-emerald-200 mb-1">(Profit + Payouts)</p>
                    <p class="text-xl font-extrabold">${formatCurrency(estimateProfit + totalProfitPayouts)}</p>
                </div>

                <!-- 13. Total Balance -->
                    <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-extrabold text-indigo-900">${formatCurrency(totalBalanceGlobal)}</p>
                </div>
            </div>

            <!-- Charts Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Shop Performance (Net Booking)</h4>
                        <div class="h-60 relative w-full">
                        <canvas id="shopPerformanceChart"></canvas>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Delivery Payment Methods</h4>
                        <div class="flex flex-col md:flex-row items-center h-60 w-full">
                        <div class="relative w-full md:w-1/2 h-full flex justify-center">
                            <canvas id="paymentMethodsChart"></canvas>
                        </div>
                        <div class="w-full md:w-1/2 p-4">
                            ${renderLegendHTML(paymentMethods, totalDeliveries)}
                        </div>
                        </div>
                    </div>
            </div>

            <!-- Leaderboard Table -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col max-h-[600px] md:max-h-[400px]">
                <div class="px-6 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <h3 class="font-bold text-slate-800 text-sm">Shop Leaderboard</h3>
                </div>
                <div class="overflow-y-auto custom-scroll">
                    <table class="w-full text-sm text-center relative block md:table">
                        <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm hidden md:table-header-group">
                            <tr>
                                <th class="px-2 py-3 text-left bg-slate-50">Shop</th>
                                <th class="px-2 py-3 text-right bg-slate-50" title="Gross Booking">Gross</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-red-600" title="Cancelled/Deducted">Cancel</th>
                                <th class="px-2 py-3 text-right bg-slate-50 font-bold" title="Net Booking">Net</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-blue-600" title="Deliveries (Accrual)">Del(Acc)</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-red-600" title="Expenses">Exp</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-emerald-700" title="Est Profit (Acc. Del - Exp)">Profit</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-cyan-700" title="Total Del - Acc. Del">Old Coll.</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-indigo-700 font-bold" title="Total Balance (Total Del - Exp)">Tot. Bal</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-amber-700" title="Stock Avail (Net - Acc. Del)">Stock(Acc)</th>
                                <th class="px-2 py-3 text-right bg-slate-50 text-purple-700" title="Percentage of Net Booking Uncollected">Stock %</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 block md:table-row-group">
                            ${shopPerformance.map(p => {
        const profit = p.accDel - p.exp;
        const oldColl = p.del - p.accDel;
        const totalBalance = p.del - p.exp;
        const stockAcc = p.net - p.accDel;
        const stockPercent = p.net > 0 ? (stockAcc / p.net) * 100 : 0;

        return `
                                    <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0 bg-white relative">
                                        <td class="px-4 py-3 text-left font-bold text-slate-900 truncate block md:table-cell md:px-2 border-b border-slate-50 md:border-none bg-slate-50/50 md:bg-transparent" title="${p.shop}">
                                            <span class="md:hidden text-xs text-slate-400 uppercase mr-2 font-normal">Shop:</span> ${p.shop}
                                        </td>
                                        <td class="px-4 py-2 text-right text-slate-500 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Gross</span> ${formatCurrency(p.gross)}
                                        </td>
                                        <td class="px-4 py-2 text-right text-red-500 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Cancel</span> ${formatCurrency(p.cancel)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-semibold text-slate-700 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-indigo-50/30 md:bg-transparent">
                                            <span class="md:hidden font-bold text-indigo-500 uppercase text-xs">Net</span> ${formatCurrency(p.net)}
                                        </td>
                                        <td class="px-4 py-2 text-right text-blue-600 font-medium block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-blue-500 uppercase text-xs">Del(Acc)</span> ${formatCurrency(p.accDel)}
                                        </td>
                                        <td class="px-4 py-2 text-right text-red-600 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-red-500 uppercase text-xs">Exp</span> ${formatCurrency(p.exp)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'} block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Profit</span> ${formatCurrency(profit)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-medium text-cyan-600 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-cyan-500 uppercase text-xs">Old Coll.</span> ${formatCurrency(oldColl)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-bold text-indigo-700 block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-indigo-600 uppercase text-xs">Tot. Bal</span> ${formatCurrency(totalBalance)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-bold ${stockAcc >= 0 ? 'text-amber-600' : 'text-red-500'} block md:table-cell md:px-2 border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-amber-600 uppercase text-xs">Stock(Acc)</span> ${formatCurrency(stockAcc)}
                                        </td>
                                        <td class="px-4 py-2 text-right font-bold ${stockPercent > 0 ? 'text-purple-600' : 'text-emerald-600'} block md:table-cell md:px-2 border-none flex justify-between items-center md:block">
                                            <span class="md:hidden font-bold text-purple-600 uppercase text-xs">Stock %</span> ${stockPercent.toFixed(1)}%
                                        </td>
                                    </tr>
                                `}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

    // 3. Init Charts
    initCharts(shopNames, shopNetValues, paymentMethods);
}

function initCharts(shopLabels, netValues, paymentData) {
    if (window.chartInstances.perf) window.chartInstances.perf.destroy();
    if (window.chartInstances.pay) window.chartInstances.pay.destroy();

    const ctx1 = document.getElementById('shopPerformanceChart').getContext('2d');
    window.chartInstances.perf = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: shopLabels.map(s => s.substring(0, 10)),
            datasets: [{
                label: 'Net Booking (AED)',
                data: netValues,
                backgroundColor: '#0d9488',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    const ctx2 = document.getElementById('paymentMethodsChart').getContext('2d');
    window.chartInstances.pay = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Cash', 'Card/ADIB', 'ATM'],
            datasets: [{
                data: [paymentData.CASH, paymentData.ADIB, paymentData.ATM],
                backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderNetBookingDetails(shopPrefix, bookingData, container) {
    if (!container) container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    if (!bookingData || !bookingData.filteredData || bookingData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No booking data found in the selected date range.</p>';
        return;
    }

    const totalBookings = bookingData.filteredData.reduce((s, d) => s + (d.amount || 0), 0);
    const totalCanceled = calculateCanceledSum(bookingData.filteredData);
    const netTotal = totalBookings - totalCanceled;

    const summaryBlock = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stat-card bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl shadow-sm border border-teal-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Gross Bookings</p>
                    <p class="text-3xl font-extrabold text-teal-700 tracking-tight">${formatCurrency(totalBookings)}</p>
                </div>
                <div class="absolute inset-0 bg-teal-500/5 transform rotate-6 scale-150 translate-x-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>

            <div class="stat-card bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-sm border border-red-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Cancel/Deducted</p>
                    <p class="text-3xl font-extrabold text-red-700 tracking-tight">${formatCurrency(totalCanceled)}</p>
                </div>
                <div class="absolute inset-0 bg-red-500/5 transform -rotate-6 scale-150 -translate-x-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>
            
            <div class="stat-card bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-sm border border-emerald-200/50 text-center relative overflow-hidden group">
                <div class="relative z-10">
                    <p class="text-sm text-slate-600 font-medium mb-2">Net Total Booking</p>
                    <p class="text-3xl font-extrabold text-emerald-700 tracking-tight">${formatCurrency(netTotal)}</p>
                </div>
                <div class="absolute inset-0 bg-emerald-500/5 transform rotate-12 scale-150 translate-y-1/2 rounded-3xl transition-transform group-hover:scale-100"></div>
            </div>
        </div>
    `;

    // Day-wise Aggregation
    const dailyAggregates = bookingData.filteredData.reduce((acc, doc) => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        const amount = doc.amount || 0;
        const isCanceled = isCanceledStatus(doc.status);

        if (!acc[dateStr]) {
            acc[dateStr] = { dateStr: dateStr, gross: 0, canceled: 0, net: 0, count: 0 };
        }

        acc[dateStr].gross += amount;
        acc[dateStr].count += 1;
        if (isCanceled) acc[dateStr].canceled += amount;

        return acc;
    }, {});

    let dailyData = Object.keys(dailyAggregates).map(dateStr => {
        const daily = dailyAggregates[dateStr];
        daily.net = daily.gross - daily.canceled;
        return { dateStr, ...daily };
    });

    const tableId = `${shopPrefix}_daily_bookings`;
    const currentSort = state.sortState[tableId];
    if (currentSort) {
        dailyData = sortArray(dailyData, currentSort.key, currentSort.dir);
    } else {
        dailyData = sortArray(dailyData, 'dateStr', 'asc');
    }

    let finalHtml = `
        <div class="space-y-8">
            ${summaryBlock}
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Net Booking Trend (${state.dateRange.start} to ${state.dateRange.end})</h3>
                ${renderDailyNetBookingTable(dailyData, 'Bookings', tableId)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Booking Records (Gross & Canceled)</h3>
                ${renderStandardTable(shopPrefix, bookingData, 'bookings', true)}
            </div>
        </div>
    `;

    container.innerHTML = finalHtml;
}


function renderDeliveryByTypeDetails(shopPrefix, deliveryData, container) {
    if (!container) container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    if (!deliveryData || !deliveryData.filteredData || deliveryData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No delivery data found in the selected date range.</p>';
        return;
    }

    const tableId = `${shopPrefix}_daily_delivery`;
    const dailyAggregatesMap = new Map();
    const categoriesSet = new Set();

    deliveryData.filteredData.forEach(doc => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';
        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
        categoriesSet.add(type);

        const amount = doc.amount || 0;
        if (!dailyAggregatesMap.has(dateStr)) {
            dailyAggregatesMap.set(dateStr, { dateStr, total: 0, count: 0, breakdown: {} });
        }
        const day = dailyAggregatesMap.get(dateStr);
        day.total += amount;
        day.count += 1;
        day.breakdown[type] = (day.breakdown[type] || 0) + amount;
    });

    const categories = Array.from(categoriesSet).sort();
    let dailyData = Array.from(dailyAggregatesMap.values());
    const currentSort = state.sortState[tableId];
    if (currentSort) dailyData = sortArray(dailyData, currentSort.key, currentSort.dir);
    else dailyData = sortArray(dailyData, 'dateStr', 'asc');

    const breakdown = deliveryData.paymentMethods || {};
    const total = deliveryData.totalAmount || 0;

    let finalHtml = `
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p class="text-xs font-bold text-slate-500 uppercase mb-2">Total Delivery Volume</p>
                    <p class="text-3xl font-black text-indigo-600">${formatCurrency(total)}</p>
                </div>
                ${Object.entries(breakdown).map(([key, val]) => `
                    <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2">${key} Collection</p>
                        <p class="text-2xl font-bold text-slate-700">${formatCurrency(val)}</p>
                    </div>
                `).join('')}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Delivery Trend</h3>
                ${renderDailyCategoryTrendTable(dailyData, categories, 'Deliveries', tableId)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Delivery Records</h3>
                ${renderStandardTable(shopPrefix, deliveryData, 'delivery', false)}
            </div>
        </div>
    `;

    container.innerHTML = finalHtml;
}

function renderExpenseByTypeDetails(shopPrefix, expenseData, container) {
    if (!container) container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    if (!expenseData || !expenseData.filteredData || expenseData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No expense data found in the selected date range.</p>';
        return;
    }

    // --- 1. FILTER STATE MANAGEMENT ---
    if (typeof window.expenseFilterState === 'undefined') {
        window.expenseFilterState = { dept: 'All', cat: 'All' };
    }

    // --- 2. BUILD MAPPINGS FOR DROPDOWNS ---
    const depts = new Set(['All']);
    const catMap = { 'All': new Set(['All']) }; // Dept -> Set of Categories

    expenseData.filteredData.forEach(doc => {
        const d = doc.dept || 'Uncategorized';
        const c = doc.cat || 'Uncategorized';

        depts.add(d);
        if (!catMap[d]) catMap[d] = new Set(['All']);
        catMap[d].add(c);
        catMap['All'].add(c);
    });

    // Reset Category filter if changing Departments makes it invalid
    if (window.expenseFilterState.dept !== 'All' &&
        window.expenseFilterState.cat !== 'All' &&
        catMap[window.expenseFilterState.dept] &&
        !catMap[window.expenseFilterState.dept].has(window.expenseFilterState.cat)) {
        window.expenseFilterState.cat = 'All';
    }

    const currentDept = window.expenseFilterState.dept;
    const currentCat = window.expenseFilterState.cat;

    window.setExpenseDeptFilter = (dept) => {
        window.expenseFilterState.dept = dept;
        window.expenseFilterState.cat = 'All';
        renderExpenseByTypeDetails(shopPrefix, expenseData, container);
    };

    window.setExpenseCatFilter = (cat) => {
        window.expenseFilterState.cat = cat;
        renderExpenseByTypeDetails(shopPrefix, expenseData, container);
    };

    // --- 3. FILTER THE DATA ---
    const filteredSubset = expenseData.filteredData.filter(doc => {
        const d = doc.dept || 'Uncategorized';
        const c = doc.cat || 'Uncategorized';
        const matchDept = currentDept === 'All' || currentDept === d;
        const matchCat = currentCat === 'All' || currentCat === c;
        return matchDept && matchCat;
    });

    // --- 4. CALCULATE METRICS & CHART DATA USING SUBSET ---
    let totalExpense = 0;
    const chartDataMap = {}; // Use Category for chart if filtering by Dept, otherwise Dept
    const breakdownKey = currentDept === 'All' ? 'dept' : 'cat';

    const tableId = `${shopPrefix}_daily_expense`;
    const categoriesSet = new Set();
    const dailyAggregatesMap = new Map();

    filteredSubset.forEach(doc => {
        const amt = doc.amount || 0;
        totalExpense += amt;

        // Chart aggregation
        const bKey = doc[breakdownKey] || 'Uncategorized';
        chartDataMap[bKey] = (chartDataMap[bKey] || 0) + amt;

        // Daily table aggregation
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        const dispCat = currentDept === 'All' ? (doc.dept || 'Uncategorized') : (doc.cat || 'Uncategorized');
        categoriesSet.add(dispCat);

        if (!dailyAggregatesMap.has(dateStr)) {
            dailyAggregatesMap.set(dateStr, { dateStr, total: 0, count: 0, breakdown: {} });
        }
        const day = dailyAggregatesMap.get(dateStr);
        day.total += amt;
        day.count += 1;
        day.breakdown[dispCat] = (day.breakdown[dispCat] || 0) + amt;
    });

    // Highest Category
    let highestCatName = 'N/A';
    let highestCatAmount = 0;
    Object.entries(chartDataMap).forEach(([k, v]) => {
        if (v > highestCatAmount) {
            highestCatAmount = v;
            highestCatName = k;
        }
    });

    // Chart Data Arrays
    const chartLabels = Object.keys(chartDataMap);
    const chartValues = Object.values(chartDataMap);

    // Sort logic for trend table
    const trendCategories = Array.from(categoriesSet).sort();
    let dailyData = Array.from(dailyAggregatesMap.values());
    const currentSort = state.sortState[tableId];
    if (currentSort) dailyData = sortArray(dailyData, currentSort.key, currentSort.dir);
    else dailyData = sortArray(dailyData, 'dateStr', 'asc');

    // Mock full object for record table
    const mockExpenseData = { ...expenseData, filteredData: filteredSubset };

    // --- 5. RENDER HTML ---
    const deptOptionsHtml = Array.from(depts).map(d =>
        `<option value="${d}" ${currentDept === d ? 'selected' : ''}>${d}</option>`
    ).join('');

    const availableCategories = Array.from(catMap[currentDept] || catMap['All']);
    const catOptionsHtml = availableCategories.map(c =>
        `<option value="${c}" ${currentCat === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
    ).join('');

    let finalHtml = `
        <div class="space-y-6 max-w-7xl mx-auto">
            
            <!-- Controls Bar -->
            <div class="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4">
                <h2 class="text-xl font-bold text-slate-800">Expense Analysis</h2>
                <div class="flex gap-3">
                    <select onchange="window.setExpenseDeptFilter(this.value)" class="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                        ${deptOptionsHtml}
                    </select>
                    <select onchange="window.setExpenseCatFilter(this.value)" class="px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:bg-white transition-colors">
                        ${catOptionsHtml}
                    </select>
                </div>
            </div>

            <!-- Dashboard Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <!-- Left: Stat Cards -->
                <div class="flex flex-col gap-4">
                    <div class="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                        <div class="absolute -right-4 -bottom-4 opacity-5">
                            <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                        </div>
                        <p class="text-xs font-bold text-red-600 uppercase mb-2 tracking-wider">Total Filtered Expense</p>
                        <p class="text-4xl font-black text-red-700">${formatCurrency(totalExpense)}</p>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between items-center">
                            Highest Drain
                            <svg class="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                        </p>
                        <p class="text-2xl font-bold text-slate-800">${highestCatName}</p>
                        <p class="text-sm text-slate-500 mt-1">${formatCurrency(highestCatAmount)}</p>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between items-center">
                            Transaction Count
                            <svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </p>
                        <p class="text-2xl font-bold text-slate-800">${filteredSubset.length}</p>
                        <p class="text-sm text-slate-500 mt-1">Receipts recorded</p>
                    </div>
                </div>

                <!-- Right: Chart -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-slate-200 flex flex-col items-center justify-center">
                    <h4 class="font-bold text-slate-700 mb-4 text-sm w-full text-left uppercase tracking-wider">Expense Distribution (${currentDept === 'All' ? 'By Department' : 'By Category'})</h4>
                    <div class="relative w-full h-72 flex justify-center">
                        ${chartValues.length > 0 ? '<canvas id="expenseDoughnutChart"></canvas>' : '<p class="text-slate-400 my-auto pb-8 italic">No data to chart</p>'}
                    </div>
                </div>
            </div>

            <!-- Tables -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 class="text-lg font-bold text-slate-800">Daily Trend (${currentDept === 'All' ? 'By Department' : 'By Category'})</h3>
                </div>
                <div class="p-4">
                    ${filteredSubset.length > 0 ? renderDailyCategoryTrendTable(dailyData, trendCategories, 'Expenses', tableId) : '<p class="text-center text-slate-400 py-6">No trends available</p>'}
                </div>
            </div>

            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <h3 class="text-lg font-bold text-slate-800">Filtered Expense Records</h3>
                </div>
                <!-- Need to wrap Standard Table as it sometimes assumes container is full width string -->
                <div class="p-0">
                    ${filteredSubset.length > 0 ? renderStandardTable(shopPrefix, mockExpenseData, 'expense', false) : '<p class="text-center text-slate-400 py-6">No records match filters</p>'}
                </div>
            </div>
        </div>
    `;

    container.innerHTML = finalHtml;

    // --- 6. RENDER CHART ---
    if (chartValues.length > 0) {
        if (window.chartInstances && window.chartInstances.expenseTrend) {
            window.chartInstances.expenseTrend.destroy();
        }

        const ctx = document.getElementById('expenseDoughnutChart').getContext('2d');

        // Generate pleasing distinct colors
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
            '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
        ];
        const bgColors = chartLabels.map((_, i) => Object.keys(chartDataMap).length <= colors.length ? colors[i] : `hsl(${(i * 137.5) % 360}, 70%, 50%)`);

        window.chartInstances.expenseTrend = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartValues,
                    backgroundColor: bgColors,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, padding: 15, font: { size: 11, family: 'Inter' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

function renderEmployeeSection(shopPrefix, container) {
    // Check both plural and singular keys just in case
    const data = state.allResults[`${shopPrefix}|employee`] || state.allResults[`${shopPrefix}|employees`];

    if (!container) container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    if (!data) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-4 italic">No employee data loaded in cache.</p>';
        return;
    }

    if (data.isError) {
        container.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <p class="text-red-700 font-bold">Failed to load staff data</p>
                <p class="text-red-600 text-sm mt-1">${data.errorMessage || 'Unknown API Error'}</p>
            </div>`;
        return;
    }

    if (!data.employees || data.employees.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p class="text-slate-500 font-medium whitespace-pre-wrap">No staff activity found in ${shopPrefix}
Between ${state.dateRange.start} and ${state.dateRange.end}</p>
            </div>`;
        return;
    }

    const employees = data.employees || [];

    // State for the filters
    if (typeof window.employeeFilterState === 'undefined') {
        window.employeeFilterState = {
            dept: 'All', // 'All', 'Piece Expense', 'Shop Expenses', etc.
            cat: 'All'   // 'All', 'salary', 'stitching', etc.
        };
    }

    // Extract unique departments and categories for the dropdowns
    const depts = new Set(['All']);
    const catMap = { 'All': new Set(['All']) }; // Map Dept -> Set of Categories

    employees.forEach(emp => {
        const d = emp.dept || 'Uncategorized';
        const c = emp.cat || 'Uncategorized';

        depts.add(d);

        if (!catMap[d]) catMap[d] = new Set(['All']);
        catMap[d].add(c);
        catMap['All'].add(c); // For when Dept is 'All'
    });

    // Reset Category filter if the new Department doesn't have it
    if (window.employeeFilterState.dept !== 'All' &&
        window.employeeFilterState.cat !== 'All' &&
        catMap[window.employeeFilterState.dept] &&
        !catMap[window.employeeFilterState.dept].has(window.employeeFilterState.cat)) {
        window.employeeFilterState.cat = 'All';
    }

    // Handlers
    window.setEmployeeDeptFilter = (dept) => {
        window.employeeFilterState.dept = dept;
        window.employeeFilterState.cat = 'All'; // Reset category when dept changes
        renderEmployeeSection(shopPrefix, container);
    };

    window.setEmployeeCatFilter = (cat) => {
        window.employeeFilterState.cat = cat;
        renderEmployeeSection(shopPrefix, container);
    };

    // Filter Logic
    const filteredEmployees = employees.filter(emp => {
        const d = emp.dept || 'Uncategorized';
        const c = emp.cat || 'Uncategorized';

        const matchDept = window.employeeFilterState.dept === 'All' || window.employeeFilterState.dept === d;
        const matchCat = window.employeeFilterState.cat === 'All' || window.employeeFilterState.cat === c;

        return matchDept && matchCat;
    });

    // Build Dropdown HTML
    const deptOptionsHtml = Array.from(depts).map(d =>
        `<option value="${d}" ${window.employeeFilterState.dept === d ? 'selected' : ''}>${d}</option>`
    ).join('');

    const availableCategories = Array.from(catMap[window.employeeFilterState.dept] || catMap['All']);
    const catOptionsHtml = availableCategories.map(c =>
        `<option value="${c}" ${window.employeeFilterState.cat === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
    ).join('');

    if (filteredEmployees.length === 0 && employees.length > 0) {
        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-800 dark:text-white">Directory</h3>
                <div class="flex gap-2">
                    <select onchange="setEmployeeDeptFilter(this.value)" class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500">
                        ${deptOptionsHtml}
                    </select>
                    <select onchange="setEmployeeCatFilter(this.value)" class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500">
                        ${catOptionsHtml}
                    </select>
                </div>
            </div>
            <div class="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p class="text-slate-500 font-medium whitespace-pre-wrap">No records found matching these filters.</p>
                <button onclick="setEmployeeDeptFilter('All')" class="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">Clear Filters</button>
            </div>`;
        return;
    }

    // Calculate Summary Stats based on FILTERED list
    const totalEmployees = filteredEmployees.length;
    let totalSalaries = 0;
    let activeCount = 0;

    const cardsHtml = filteredEmployees.map(emp => {
        const salary = emp.total || 0;
        totalSalaries += salary;
        const status = emp.status || 'active';
        if (status === 'active') activeCount++;

        return `
        <div class="employee-card bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow relative group cursor-pointer" 
             data-name="${emp.name.toLowerCase()}"
             onclick="viewEmployeeHistory('${shopPrefix}', '${emp.name}')">
            <div class="flex items-center space-x-4">
               <div class="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-lg">
                    ${emp.name.charAt(0).toUpperCase()}
               </div>
               <div>
                   <h4 class="font-bold text-slate-800 dark:text-slate-200">${emp.name}</h4>
                   <p class="text-xs text-slate-500 dark:text-slate-400">${emp.designation || (emp.dept ? emp.cat + ' / ' + emp.dept : 'General')}</p>
               </div>
            </div>
            <div class="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                 <div class="flex justify-between text-sm mb-1">
                    <span class="text-slate-500 dark:text-slate-400">Period Total</span>
                    <span class="font-semibold text-slate-700 dark:text-slate-300">${formatCurrency(salary)}</span>
                 </div>
                 <div class="flex justify-between text-sm">
                    <span class="text-slate-500 dark:text-slate-400">Records</span>
                    <span class="font-semibold text-slate-700 dark:text-slate-300">${emp.count || 0} entries</span>
                 </div>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Filter Controls -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 class="text-xl font-bold text-slate-800 dark:text-white">Directory</h3>
                <div class="flex flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-slate-500 uppercase">Dept:</span>
                        <select onchange="setEmployeeDeptFilter(this.value)" class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm">
                            ${deptOptionsHtml}
                        </select>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-slate-500 uppercase">Cat:</span>
                        <select onchange="setEmployeeCatFilter(this.value)" class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm">
                            ${catOptionsHtml}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Summary Header -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                     <p class="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-semibold">Filtered Listed</p>
                     <p class="text-2xl font-bold text-indigo-900 dark:text-indigo-100">${totalEmployees}</p>
                 </div>
                 <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                     <p class="text-xs text-green-600 dark:text-green-400 uppercase font-semibold">Active Now</p>
                     <p class="text-2xl font-bold text-green-900 dark:text-green-100">${activeCount}</p>
                 </div>
                 <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                     <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Filtered Amount</p>
                     <p class="text-2xl font-bold text-slate-700 dark:text-slate-200">${formatCurrency(totalSalaries)}</p>
                 </div>
            </div>

            <!-- Search Bar -->
            <div class="relative">
                 <input type="text" placeholder="Search filtered directory..." 
                    class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                    oninput="filterEmployeeGrid(this.value)">
                 <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
            </div>

            <!-- Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="employeeGrid">
                ${cardsHtml}
            </div>
        </div>
    `;

    if (typeof window.filterEmployeeGrid === 'undefined') {
        window.filterEmployeeGrid = (searchTerm) => {
            const term = searchTerm.toLowerCase();
            const cards = document.querySelectorAll('#employeeGrid .employee-card');
            cards.forEach(card => {
                const name = card.getAttribute('data-name') || '';
                if (name.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        };
    }
}

/**
 * Renders a detailed history modal for an employee.
 */
async function viewEmployeeHistory(shop, name) {
    const { fetchEmployeeHistory } = await import('./api.js');

    // Create Modal Container
    let modal = document.getElementById('employeeHistoryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'employeeHistoryModal';
        modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
            <div class="p-8 flex items-center justify-center">
                <div class="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
        </div>
        `;

    try {
        const history = await fetchEmployeeHistory(shop, name);

        const totalEarned = history.reduce((sum, r) => sum + (r.amount || 0), 0);

        modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                <!-- Header -->
                <div class="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <div class="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xl">${name.charAt(0).toUpperCase()}</div>
                            <div>
                                <h3 class="text-2xl font-bold">${name}</h3>
                                <p class="text-indigo-100 text-sm">Staff Activity Log • ${shop}</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('employeeHistoryModal').classList.add('hidden')" class="text-indigo-200 hover:text-white p-2 rounded-lg transition-colors">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Stats Bar -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Total Earned</p>
                        <p class="text-lg font-black text-indigo-600">${formatCurrency(totalEarned)}</p>
                    </div>
                    <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Entries</p>
                        <p class="text-lg font-black text-slate-700 dark:text-slate-200">${history.length}</p>
                    </div>
                </div>

                <!-- History Table Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
            ${history.length === 0 ? '<p class="text-center text-slate-500 py-10">No records found for this period.</p>' : `
                        <div class="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400 block md:table">
                                <thead class="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300 hidden md:table-header-group">
                                    <tr>
                                        <th class="px-6 py-3">Date</th>
                                        <th class="px-6 py-3">Category</th>
                                        <th class="px-6 py-3">Reference/Note</th>
                                        <th class="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-700 block md:table-row-group">
                                    ${history.map(row => `
                                        <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors block md:table-row border-b-4 border-slate-50 md:border-none mb-4 md:mb-0">
                                            <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-slate-50/50 md:bg-transparent">
                                                <span class="md:hidden font-bold text-slate-500 uppercase text-[10px]">Date</span>
                                                <span>${new Date(row.date).toLocaleDateString()}</span>
                                            </td>
                                            <td class="px-6 py-4 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                                <span class="md:hidden font-bold text-slate-500 uppercase text-[10px]">Category</span>
                                                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    ${row.cat || 'General'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                                                <span class="md:hidden font-bold text-slate-500 uppercase text-[10px]">Reference</span>
                                                <span>${row.description || row.dept || '-'}</span>
                                            </td>
                                            <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white block md:table-cell md:border-none flex justify-between items-center md:block">
                                                <span class="md:hidden font-bold text-slate-500 uppercase text-[10px]">Amount</span>
                                                <span>${formatCurrency(row.amount)}</span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                     `}
        </div>
            </div>
        `;
    } catch (err) {
        modal.innerHTML = `
            <div class="bg-white p-8 rounded-2xl text-center">
                <p class="text-red-500 font-bold">Failed to load history</p>
                <p class="text-sm text-slate-500 mt-2">${err.message}</p>
                <button onclick="document.getElementById('employeeHistoryModal').classList.add('hidden')" class="mt-4 px-4 py-2 bg-slate-100 rounded-lg">Close</button>
            </div>
        `;
    }
}

window.viewEmployeeHistory = viewEmployeeHistory;


function renderLegendHTML(methods, total) {
    const colors = { CASH: '#10b981', ADIB: '#6366f1', ATM: '#f59e0b', OTHER: '#94a3b8' };
    const labels = { CASH: 'Cash', ADIB: 'Card/ADIB', ATM: 'ATM', OTHER: 'Other' };

    let html = '<div class="space-y-3">';
    for (const [key, val] of Object.entries(methods)) {
        if (val > 0 || key === 'CASH') {
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            html += `
        <div class="flex flex-wrap items-center justify-between text-sm gap-y-1">
                    <div class="flex items-center min-w-[100px]">
                        <span class="w-3 h-3 rounded-full mr-2 shrink-0" style="background-color: ${colors[key]}"></span>
                        <span class="text-slate-600 font-medium truncate">${labels[key]}</span>
                    </div>
                    <div class="flex items-center text-slate-700 gap-2">
                        <span class="font-bold whitespace-nowrap">${formatCurrency(val)}</span>
                        <span class="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded leading-none">${percent}%</span>
                    </div>
                </div>
        `;
        }
    }
    html += '</div>';
    return html;
}


// Helper functions (inline replacement of utils needed if not imported, but we imported them)

/**
 * Shows detailed breakdown for Profit Payouts in a modal.
 */
export function viewProfitDetails(shop) {
    const exp = state.allResults[`${shop}|expense`];
    if (!exp || !exp.filteredData) return;

    const profitData = exp.filteredData.filter(d => (d.dept || '').toLowerCase().trim() === 'profit');

    // Group by category
    const breakdown = profitData.reduce((acc, d) => {
        const cat = d.cat ? d.cat.toLowerCase().trim() : 'general';
        if (!acc[cat]) acc[cat] = { total: 0, entries: [] };
        acc[cat].total += d.amount || 0;
        acc[cat].entries.push(d);
        return acc;
    }, {});

    showProfitModal(`${shop} Profit Payouts`, breakdown);
}

/**
 * Shows Global Profit breakdown (Shop -> Category)
 */
/**
 * Shows Global Profit breakdown (Category -> Entries from all shops)
 */
export function viewGlobalProfitDetails() {
    const categoryBreakdown = {};
    let total = 0;

    SHOP_PREFIXES.forEach(shop => {
        const exp = state.allResults[`${shop}|expense`];
        if (!exp || !exp.filteredData) return;

        const shopProfit = exp.filteredData.filter(d => (d.dept || '').toLowerCase().trim() === 'profit');
        if (shopProfit.length === 0) return;

        shopProfit.forEach(d => {
            const cat = d.cat ? d.cat.toLowerCase().trim() : 'general';
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, entries: [] };

            categoryBreakdown[cat].total += d.amount || 0;
            // Add shop name to the entry for display
            categoryBreakdown[cat].entries.push({ ...d, _shopName: shop });

            total += d.amount || 0;
        });
    });

    showGlobalProfitModal(categoryBreakdown, total);
}

function showProfitModal(title, breakdown) {
    let modal = document.getElementById('detailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4 transition-all duration-300';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
        document.body.appendChild(modal);
    }

    const sortedCats = Object.keys(breakdown).sort((a, b) => breakdown[b].total - breakdown[a].total);
    const grandTotal = Object.values(breakdown).reduce((acc, curr) => acc + curr.total, 0);

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <!-- Header -->
            <div class="bg-gradient-to-r from-rose-500 to-red-600 p-6 text-white shrink-0 relative overflow-hidden">
                <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight">${title}</h3>
                        <p class="text-rose-100 text-sm font-medium mt-1">Total Distribution</p>
                        <p class="text-3xl font-black mt-1 tracking-tight">${formatCurrency(grandTotal)}</p>
                    </div>
                    <button onclick="document.getElementById('detailsModal').classList.add('hidden')" 
                            class="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto custom-scroll space-y-6 bg-slate-50/50 flex-1 min-h-0">
                ${sortedCats.map(cat => `
                    <div class="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                        <!-- Category Header -->
                        <div class="px-5 py-4 flex justify-between items-center bg-slate-50/80 border-b border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                                <span class="text-sm font-bold text-slate-700 uppercase tracking-wider">${cat}</span>
                            </div>
                            <span class="text-lg font-bold text-slate-800">${formatCurrency(breakdown[cat].total)}</span>
                        </div>
                        
                        <!-- Entries List -->
                        <div class="divide-y divide-slate-50">
                            ${breakdown[cat].entries.map(e => `
                                <div class="px-5 py-3 hover:bg-slate-50/50 transition-colors flex justify-between items-center group">
                                    <div class="flex flex-col">
                                        <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                            ${e.name || e.description || 'Payout'}
                                        </span>
                                        <span class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                                            ${new Date(e.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span class="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-sm group-hover:bg-rose-100 transition-colors">
                                        ${formatCurrency(e.amount)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                
                ${sortedCats.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-12 text-center">
                        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p class="text-slate-500 font-medium">No profit payouts recorded yet.</p>
                    </div>
                ` : ''}
            </div>
            
            <!-- Footer -->
             <div class="bg-white border-t border-slate-100 p-4 text-center shrink-0">
                <p class="text-xs text-slate-400">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function showGlobalProfitModal(breakdown, total) {
    let modal = document.getElementById('detailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4 transition-all duration-300';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
        document.body.appendChild(modal);
    }

    const sortedCats = Object.keys(breakdown).sort((a, b) => breakdown[b].total - breakdown[a].total);

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <!-- Header -->
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shrink-0 relative overflow-hidden">
                 <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight">Global Profit Distribution</h3>
                        <p class="text-indigo-100 text-sm font-medium mt-1">Total Across All Shops (Category Wise)</p>
                        <p class="text-4xl font-black mt-2 tracking-tight">${formatCurrency(total)}</p>
                    </div>
                    <button onclick="document.getElementById('detailsModal').classList.add('hidden')" 
                             class="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- Grid Content -->
            <div class="p-6 overflow-y-auto custom-scroll bg-slate-50/50 flex-1 min-h-0">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${sortedCats.map(cat => `
                        <div class="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                            <!-- Category Header -->
                            <div class="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                                    <h4 class="font-bold text-slate-800 text-lg uppercase tracking-tight">${cat}</h4>
                                </div>
                                <span class="bg-purple-50 text-purple-700 text-sm font-bold px-2 py-1 rounded-md border border-purple-100">
                                    ${formatCurrency(breakdown[cat].total)}
                                </span>
                            </div>
                            
                            <!-- Detailed Entries List -->
                            <div class="divide-y divide-slate-50 flex-1 overflow-y-auto custom-scroll max-h-[300px]">
                                ${breakdown[cat].entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => `
                                    <div class="px-5 py-3 hover:bg-slate-50/50 transition-colors flex justify-between items-center group">
                                        <div class="flex flex-col gap-0.5">
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                                                    ${e._shopName}
                                                </span>
                                                <span class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                                                    ${new Date(e.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate max-w-[180px]" title="${e.name || e.description || 'Payout'}">
                                                ${e.name || e.description || 'Payout'}
                                            </span>
                                        </div>
                                        <span class="font-bold text-slate-700 text-sm">
                                            ${formatCurrency(e.amount)}
                                        </span>
                                    </div>
                                `).join('')}
                                ${breakdown[cat].entries.length === 0 ? '<p class="text-xs text-slate-400 italic text-center py-4">No entries</p>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
             <!-- Footer -->
             <div class="bg-white border-t border-slate-100 p-4 text-center shrink-0">
                <p class="text-xs text-slate-400">Aggregated View</p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

export async function openOwnerReportModal() {
    const shopPrefix = state.activeShop;
    if (!shopPrefix || shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE' || shopPrefix === 'CUSTOMERS') {
        alert("Please select a specific shop from the sidebar to view the Owner Report.");
        return;
    }

    const modal = document.getElementById('ownerReportModal');
    const contentArea = document.getElementById('ownerReportContentArea');
    const loadingObj = document.getElementById('ownerReportLoading');
    const shopNameEl = document.getElementById('ownerReportShopName');
    const dateRangeEl = document.getElementById('ownerReportDateRange');

    if (!modal) return;

    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);

    // Set Header
    shopNameEl.textContent = shopPrefix.toUpperCase() + " SUMMARY REPORT";
    const startDateRaw = document.getElementById('startDate').value;
    const endDateRaw = document.getElementById('endDate').value;
    dateRangeEl.textContent = `${startDateRaw} to ${endDateRaw}`;

    contentArea.innerHTML = '';
    loadingObj.classList.remove('hidden');
    loadingObj.classList.add('flex');

    try {
        const bk = state.allResults[`${shopPrefix}|bookings`];
        const del = state.allResults[`${shopPrefix}|delivery`];
        const exp = state.allResults[`${shopPrefix}|expense`];

        if (!bk || !del || !exp) {
            alert("Ensure all shop data (Bookings, Deliveries, Expenses) is loaded before proceeding.");
            closeOwnerReportModal();
            return;
        }

        // --- Fetch Account Summary Data ---
        let accountSummary = { openingBalance: 0, adjustAmount: 0 };
        try {
            const accountSummaryRes = await fetch(`${BASE_URL}/api/${shopPrefix}/owner_account_summary?start=${startDateRaw}&end=${endDateRaw}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (accountSummaryRes.ok) {
                accountSummary = await accountSummaryRes.json();
            }
        } catch (err) {
            console.error("Failed to fetch owner account summary:", err);
        }

        let currentGross = 0, currentCanceled = 0;
        (bk.filteredData || []).forEach(b => {
            const amt = b.amount || 0;
            currentGross += amt;
            if (isCanceledStatus(b.status)) currentCanceled += amt;
        });
        const currentNet = currentGross - currentCanceled;

        let totalDelivery = 0;
        const deliveryBreakdown = { CASH: 0, ADIB: 0, ATM: 0 };
        let cashMiscCollections = 0;
        let salmanMiscCollection = 0;
        let otherMiscCollection = 0;
        const bankMiscCollections = { ADIB: 0, ATM: 0 };
        let shopBookingDel = 0;

        (del.filteredData || []).forEach(d => {
            const amt = d.amount || 0;
            let type = d.amountType ? d.amountType.toUpperCase().trim() : 'CASH';
            if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';
            if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
            
            const bNo = String(d.billNo || '').trim().toLowerCase();
            if (bNo === 'other-amounts') {
                if (type === 'CASH') {
                    cashMiscCollections += amt;
                    let remark = (d.remarks || '').trim().toLowerCase();
                    if (remark.includes('salman')) {
                        salmanMiscCollection += amt;
                    } else {
                        otherMiscCollection += amt;
                    }
                } else {
                    bankMiscCollections[type] += amt;
                }
            } else {
                shopBookingDel += amt;
                totalDelivery += amt;
                deliveryBreakdown[type] += amt;
            }
        });

        const accrualData = state.allResults[`${shopPrefix}|accrual_delivery`];
        const accrualDel = accrualData ? (accrualData.totalAccrualAmount || 0) : 0;
        const oldCollection = shopBookingDel - accrualDel;

        let totalExpense = 0;
        (exp.filteredData || []).forEach(e => {
            totalExpense += (e.amount || 0);
        });

        const { openingBalance, adjustAmount } = accountSummary;
        const totalAmount = openingBalance + deliveryBreakdown.CASH + cashMiscCollections + adjustAmount;
        const finalBalance = totalAmount - totalExpense;

        let miscCollectionsHtml = '';
        if (salmanMiscCollection > 0) {
            miscCollectionsHtml += `
                <div class="flex justify-between items-center px-4 py-2">
                    <span class="font-medium text-lg">+ Received From Salman</span>
                    <span class="font-bold text-lg">${formatCurrency(salmanMiscCollection)}</span>
                </div>
            `;
        }
        
        if (otherMiscCollection > 0 || salmanMiscCollection === 0) {
            miscCollectionsHtml += `
                <div class="flex justify-between items-center px-4 py-2">
                    <span class="font-medium text-lg">+ Cash Collection</span>
                    <span class="font-bold text-lg">${formatCurrency(otherMiscCollection)}</span>
                </div>
            `;
        }

        contentArea.innerHTML = `
            <!-- Net Booking Section -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm mb-6">
                <h3 class="text-xl font-bold text-indigo-900 tracking-tight flex items-center mb-2">
                    <svg class="w-6 h-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Net Booking
                </h3>
                <p class="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Gross (${formatCurrency(currentGross)}) - Cancelled (${formatCurrency(currentCanceled)})</p>
                <p class="text-4xl font-black text-indigo-800 tracking-tight">${formatCurrency(currentNet)}</p>
            </div>

            <!-- Delivery Summary Section -->
            <div class="bg-teal-50 border border-teal-100 rounded-xl p-6 shadow-sm mb-6">
                <h3 class="text-xl font-bold text-teal-900 tracking-tight flex items-center mb-4">
                    <svg class="w-6 h-6 mr-2 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Delivery Summary
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center text-teal-800">
                        <span class="font-medium text-lg">DEL (Accrual)</span>
                        <span class="font-bold text-lg">${formatCurrency(accrualDel)}</span>
                    </div>
                    <div class="flex justify-between items-center text-teal-800">
                        <span class="font-medium text-lg">Old Booking Collection</span>
                        <span class="font-bold text-lg">${formatCurrency(oldCollection)}</span>
                    </div>
                    <div class="flex justify-between items-center text-teal-900 mt-4 pt-4 border-t border-teal-200">
                        <span class="font-bold text-xl uppercase tracking-widest">Total</span>
                        <span class="text-3xl font-black">${formatCurrency(accrualDel + oldCollection)}</span>
                    </div>
                </div>
            </div>

            <!-- Delivery Breakdown Section -->
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm mb-6">
                <h3 class="text-xl font-bold text-blue-900 tracking-tight flex items-center mb-4">
                    <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Delivery Breakdown
                </h3>
                <div class="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                     <div class="bg-white/60 p-4 rounded-lg border border-blue-200 shadow-sm text-center">
                         <p class="text-sm font-bold text-blue-600 uppercase mb-1 tracking-widest">ATM</p>
                         <p class="text-xl font-bold text-blue-900">${formatCurrency(deliveryBreakdown.ATM)}</p>
                     </div>
                     <div class="bg-white/60 p-4 rounded-lg border border-blue-200 shadow-sm text-center">
                         <p class="text-sm font-bold text-blue-600 uppercase mb-1 tracking-widest">ADIB</p>
                         <p class="text-xl font-bold text-blue-900">${formatCurrency(deliveryBreakdown.ADIB)}</p>
                     </div>
                     <div class="bg-white/60 p-4 rounded-lg border border-blue-200 shadow-sm text-center">
                         <p class="text-sm font-bold text-blue-600 uppercase mb-1 tracking-widest">CASH</p>
                         <p class="text-xl font-bold text-blue-900">${formatCurrency(deliveryBreakdown.CASH)}</p>
                     </div>
                 </div>
                 <div class="flex justify-between items-center text-blue-900 mt-2 pt-4 border-t border-blue-200">
                    <span class="font-bold text-xl uppercase tracking-widest">Total</span>
                    <span class="text-3xl font-black">${formatCurrency(deliveryBreakdown.ATM + deliveryBreakdown.ADIB + deliveryBreakdown.CASH)}</span>
                 </div>
            </div>

            <!-- Bank Misc Collections Block -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm mb-6">
                <h3 class="text-xl font-bold text-indigo-900 tracking-tight flex items-center mb-4">
                    <svg class="w-6 h-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Bank Misc Collections
                </h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                     <div class="bg-white/60 p-4 rounded-lg border border-indigo-200 shadow-sm text-center">
                         <p class="text-sm font-bold text-indigo-600 uppercase mb-1 tracking-widest">ATM</p>
                         <p class="text-xl font-bold text-indigo-900">${formatCurrency(bankMiscCollections.ATM)}</p>
                     </div>
                     <div class="bg-white/60 p-4 rounded-lg border border-indigo-200 shadow-sm text-center">
                         <p class="text-sm font-bold text-indigo-600 uppercase mb-1 tracking-widest">ADIB</p>
                         <p class="text-xl font-bold text-indigo-900">${formatCurrency(bankMiscCollections.ADIB)}</p>
                     </div>
                </div>
                <div class="flex justify-between items-center text-indigo-900 mt-2 pt-4 border-t border-indigo-200">
                    <span class="font-bold text-xl uppercase tracking-widest">Total</span>
                    <span class="text-3xl font-black">${formatCurrency(bankMiscCollections.ATM + bankMiscCollections.ADIB)}</span>
                 </div>
            </div>

            <!-- Account Summary Section -->
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-6 shadow-sm">
                <h3 class="text-xl font-bold text-amber-900 tracking-tight flex items-center mb-6 border-b border-amber-200 pb-4">
                    <svg class="w-6 h-6 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Account Summary
                </h3>
                <div class="space-y-4 text-amber-900">
                    <div class="flex justify-between items-center p-3 bg-white/50 rounded border border-amber-200 shadow-sm">
                        <span class="font-medium text-lg">Opening Balance <span class="text-xs font-normal text-amber-700 ml-1">(From ${startDateRaw})</span></span>
                        <span class="font-bold text-lg">${formatCurrency(openingBalance)}</span>
                    </div>
                    <div class="flex justify-between items-center px-4 py-2">
                        <span class="font-medium text-lg">+ Cash Delivery</span>
                        <span class="font-bold text-lg">${formatCurrency(deliveryBreakdown.CASH)}</span>
                    </div>
                    ${miscCollectionsHtml}
                    <div class="flex justify-between items-center px-4 py-2">
                        <span class="font-medium text-lg">+ Adjust Amount <span class="text-xs font-normal text-amber-700 ml-1">(Extra - Short)</span></span>
                        <span class="font-bold text-lg">${formatCurrency(adjustAmount)}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-amber-100 rounded border border-amber-300 shadow-sm mt-4">
                        <span class="font-bold text-xl uppercase tracking-widest">Total Amount</span>
                        <span class="text-2xl font-black">${formatCurrency(totalAmount)}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 bg-rose-50 rounded border border-rose-200 shadow-sm text-rose-800 mt-4">
                        <span class="font-bold text-xl uppercase tracking-widest">- Expense</span>
                        <span class="text-2xl font-black">${formatCurrency(totalExpense)}</span>
                    </div>
                    <div class="flex justify-between items-center p-4 bg-emerald-600 rounded-xl shadow-lg text-white mt-6">
                        <span class="font-black text-2xl uppercase tracking-widest">Balance</span>
                        <span class="text-4xl font-black">${formatCurrency(finalBalance)}</span>
                    </div>
                </div>
            </div>
        `;

    } catch (err) {
        console.error("Owner Report Modal error: ", err);
        alert("An error occurred while building the report. Check the console.");
    } finally {
        loadingObj.classList.remove('flex');
        loadingObj.classList.add('hidden');
    }
}

export function closeOwnerReportModal() {
    const modal = document.getElementById('ownerReportModal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

/**
 * Generates an instant, highly optimized PDF specifically for the modal's contents.
 * Bypasses html2pdf/html2canvas limitations with modern CSS (oklch) by using native browser printing.
 */
export async function printOwnerReport() {
    const printArea = document.getElementById('ownerReportPrintArea');
    const shopName = document.getElementById('ownerReportShopName').textContent;
    const dateRange = document.getElementById('ownerReportDateRange').textContent;

    if (!printArea) return;

    // Give visual feedback on the button
    const btn = document.querySelector('button[onclick="printOwnerReport()"]');
    let originalContent = "Save PDF";
    if (btn) {
        originalContent = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Preparing...`;
        btn.disabled = true;
    }

    try {
        // Collect all styles from the parent document to ensure Tailwind works
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(node => node.outerHTML)
            .join('\n');

        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; // fixed avoids scrolling issues
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${shopName} - Owner Report</title>
                    ${styles}
                    <style>
                        @page { size: auto; margin: 10mm; }
                        body { 
                            background-color: white !important; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            padding: 24px;
                            font-family: 'Inter', sans-serif;
                        }
                        /* Override scrolling constraints inside iframe */
                        .custom-scroll { overflow: visible !important; max-height: none !important; }
                        /* Header specific for print */
                        .print-header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
                        .print-header h1 { font-size: 24px; font-weight: bold; color: #1e293b; margin: 0; }
                        .print-header p { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>${shopName}</h1>
                        <p>${dateRange}</p>
                    </div>
                    <div class="max-w-3xl mx-auto">
                        ${printArea.innerHTML}
                    </div>
                </body>
            </html>
        `);
        doc.close();

        // Wait a tiny bit for browser to parse styles and render DOM
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use the native print dialog
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Clean up after print dialog context yields
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 3000);

    } catch (err) {
        console.error("Failed to sequence print dialog: ", err);
        alert("Failed to open print dialog.");
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

export function viewMiscCollectionDetails(shop) {
    const del = state.allResults[`${shop}|delivery`];
    if (!del || !del.filteredData) return;

    const miscData = del.filteredData.filter(d => {
        const bNo = (d.billNo || '').toLowerCase().trim();
        return !(bNo && bNo !== 'other-amounts');
    });

    showMiscCollectionModal(`${shop} Misc Collections`, miscData);
}

export function viewGlobalMiscCollectionDetails() {
    const allMiscEntries = [];
    let total = 0;

    SHOP_PREFIXES.forEach(shop => {
        const del = state.allResults[`${shop}|delivery`];
        if (!del || !del.filteredData) return;

        const shopMisc = del.filteredData.filter(d => {
            const bNo = (d.billNo || '').toLowerCase().trim();
            return !(bNo && bNo !== 'other-amounts');
        });

        shopMisc.forEach(d => {
            allMiscEntries.push({ ...d, _shopName: shop });
            total += d.amount || 0;
        });
    });

    showGlobalMiscCollectionModal(allMiscEntries, total);
}

function showMiscCollectionModal(title, entries) {
    let modal = document.getElementById('detailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4 transition-all duration-300';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
        document.body.appendChild(modal);
    }

    const grandTotal = entries.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    // Sort entries by date descending
    const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // UNIQUE REMARKS AND PAYMENT METHODS
    const uniqueRemarks = Array.from(new Set(
        entries.map(e => {
            const val = (e.remark || e.remarks || e.description || '').trim();
            if (!val) return '';
            return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }).filter(r => r !== '')
    )).sort();

    const pMethods = { CASH: 0, ADIB: 0, ATM: 0, OTHER: 0 };
    entries.forEach(e => {
        let type = e.amountType ? e.amountType.toUpperCase().trim() : 'CASH';
        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
        pMethods[type] += e.amount || 0;
    });

    // Global function for filtering
    window.filterMiscCollections = function () {
        const term = document.getElementById('miscSearchInput').value.toLowerCase();
        let visibleCount = 0;
        let pMethods = { CASH: 0, ADIB: 0, ATM: 0, OTHER: 0 };
        let currentTotal = 0;

        document.querySelectorAll('.misc-item-row').forEach(row => {
            const text = row.getAttribute('data-search').toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                visibleCount++;

                const amt = parseFloat(row.getAttribute('data-amount')) || 0;
                let type = (row.getAttribute('data-type') || 'CASH').toUpperCase().trim();
                if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
                if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
                pMethods[type] += amt;
                currentTotal += amt;
            } else {
                row.style.display = 'none';
            }
        });

        const totalEl = document.getElementById('miscGrandTotal');
        if (totalEl) totalEl.innerText = formatCurrency(currentTotal);

        const badgesContainer = document.getElementById('miscPaymentBadges');
        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            if (pMethods.CASH > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">CASH: ${formatCurrency(pMethods.CASH)}</span>`;
            if (pMethods.ADIB > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ADIB: ${formatCurrency(pMethods.ADIB)}</span>`;
            if (pMethods.ATM > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ATM: ${formatCurrency(pMethods.ATM)}</span>`;
        }

        const emptyState = document.getElementById('miscEmptyState');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
        }
    };

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <!-- Header -->
            <div class="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shrink-0 relative overflow-hidden">
                <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight">${title}</h3>
                        <p class="text-amber-100 text-sm font-medium mt-1">Total Misc Collections</p>
                        <div class="flex items-end gap-3 mt-1">
                            <p id="miscGrandTotal" class="text-3xl font-black tracking-tight">${formatCurrency(grandTotal)}</p>
                            <div id="miscPaymentBadges" class="flex gap-2 mb-1">
                                ${pMethods.CASH > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">CASH: ${formatCurrency(pMethods.CASH)}</span>` : ''}
                                ${pMethods.ADIB > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ADIB: ${formatCurrency(pMethods.ADIB)}</span>` : ''}
                                ${pMethods.ATM > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ATM: ${formatCurrency(pMethods.ATM)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('detailsModal').classList.add('hidden')" 
                            class="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- Search Filter -->
            <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex gap-2">
                <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input type="text" id="miscSearchInput" onkeyup="filterMiscCollections()" 
                           class="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors" 
                           placeholder="Filter by remarks or bill no...">
                </div>
                <select id="miscRemarkSelect" onchange="document.getElementById('miscSearchInput').value = this.value; filterMiscCollections();" 
                        class="block w-1/3 py-2 px-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-700 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors custom-scroll">
                    <option value="">All Remarks</option>
                    ${uniqueRemarks.map(r => `<option value="${r.replace(/"/g, '&quot;')}">${r}</option>`).join('')}
                </select>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto custom-scroll space-y-4 bg-slate-50/50 flex-1 min-h-0">
                <div class="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    <div class="divide-y divide-slate-50">
                        ${sortedEntries.map(e => {
        const remarkStr = e.remark || e.remarks || e.description || '';
        const searchStr = `${e.billNo || ''} ${remarkStr}`.replace(/"/g, '&quot;');
        const displayDesc = remarkStr ? '- ' + remarkStr : '';
        return `
                            <div class="misc-item-row px-5 py-3 hover:bg-slate-50/50 transition-colors flex justify-between items-center group" data-search="${searchStr}" data-amount="${e.amount || 0}" data-type="${e.amountType || 'CASH'}">
                                <div class="flex flex-col">
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                        ${e.billNo || 'Misc Delivery'} ${displayDesc}
                                    </span>
                                    <span class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                                        ${new Date(e.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <span class="flex flex-col items-end">
                                    <span class="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-sm group-hover:bg-amber-100 transition-colors">
                                        ${formatCurrency(e.amount)}
                                    </span>
                                    <span class="text-[9px] uppercase tracking-wider text-amber-500/80 mt-0.5 font-bold">${e.amountType || 'CASH'}</span>
                                </span>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                <!-- Empty State -->
                <div id="miscEmptyState" class="${sortedEntries.length === 0 ? 'flex' : 'hidden'} flex-col items-center justify-center py-12 text-center">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-slate-500 font-medium">No misc collections matched.</p>
                </div>
            </div>
            
            <!-- Footer -->
             <div class="bg-white border-t border-slate-100 p-4 text-center shrink-0">
                <p class="text-xs text-slate-400">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function showGlobalMiscCollectionModal(entries, total) {
    let modal = document.getElementById('detailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4 transition-all duration-300';
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
        document.body.appendChild(modal);
    }

    const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    // UNIQUE REMARKS AND PAYMENT METHODS
    const uniqueRemarks = Array.from(new Set(
        entries.map(e => {
            const val = (e.remark || e.remarks || e.description || '').trim();
            if (!val) return '';
            return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }).filter(r => r !== '')
    )).sort();

    const pMethods = { CASH: 0, ADIB: 0, ATM: 0, OTHER: 0 };
    entries.forEach(e => {
        let type = e.amountType ? e.amountType.toUpperCase().trim() : 'CASH';
        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
        pMethods[type] += e.amount || 0;
    });

    // Global function for filtering
    window.filterMiscCollections = function () {
        const term = document.getElementById('miscSearchInput').value.toLowerCase();
        let visibleCount = 0;
        let pMethods = { CASH: 0, ADIB: 0, ATM: 0, OTHER: 0 };
        let currentTotal = 0;

        document.querySelectorAll('.misc-item-row').forEach(row => {
            const text = row.getAttribute('data-search').toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                visibleCount++;

                const amt = parseFloat(row.getAttribute('data-amount')) || 0;
                let type = (row.getAttribute('data-type') || 'CASH').toUpperCase().trim();
                if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER') || type.includes('ADIB')) type = 'ADIB';
                if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
                pMethods[type] += amt;
                currentTotal += amt;
            } else {
                row.style.display = 'none';
            }
        });

        const totalEl = document.getElementById('miscGrandTotal');
        if (totalEl) totalEl.innerText = formatCurrency(currentTotal);

        const badgesContainer = document.getElementById('miscPaymentBadges');
        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            if (pMethods.CASH > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">CASH: ${formatCurrency(pMethods.CASH)}</span>`;
            if (pMethods.ADIB > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ADIB: ${formatCurrency(pMethods.ADIB)}</span>`;
            if (pMethods.ATM > 0) badgesContainer.innerHTML += `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ATM: ${formatCurrency(pMethods.ATM)}</span>`;
        }

        const emptyState = document.getElementById('miscEmptyState');
        if (emptyState) {
            emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
        }
    };

    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <!-- Header -->
            <div class="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white shrink-0 relative overflow-hidden">
                 <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div class="relative z-10 flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold tracking-tight">Global Misc Collections</h3>
                        <p class="text-amber-100 text-sm font-medium mt-1">Across All Shops</p>
                        <div class="flex items-end gap-3 mt-1">
                            <p id="miscGrandTotal" class="text-4xl font-black tracking-tight">${formatCurrency(total)}</p>
                            <div id="miscPaymentBadges" class="flex gap-2 mb-1.5">
                                ${pMethods.CASH > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">CASH: ${formatCurrency(pMethods.CASH)}</span>` : ''}
                                ${pMethods.ADIB > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ADIB: ${formatCurrency(pMethods.ADIB)}</span>` : ''}
                                ${pMethods.ATM > 0 ? `<span class="px-2 py-0.5 bg-white/20 border border-white/30 rounded text-xs font-bold text-white shadow-sm">ATM: ${formatCurrency(pMethods.ATM)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('detailsModal').classList.add('hidden')" 
                             class="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <!-- Search Filter -->
            <div class="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex gap-2">
                <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input type="text" id="miscSearchInput" onkeyup="filterMiscCollections()" 
                           class="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors" 
                           placeholder="Filter by shop, remarks or bill no...">
                </div>
                <select id="miscRemarkSelect" onchange="document.getElementById('miscSearchInput').value = this.value; filterMiscCollections();" 
                        class="block w-1/3 py-2 px-3 border border-slate-200 rounded-xl leading-5 bg-white text-slate-700 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors custom-scroll">
                    <option value="">All Remarks</option>
                    ${uniqueRemarks.map(r => `<option value="${r.replace(/"/g, '&quot;')}">${r}</option>`).join('')}
                </select>
            </div>

            <!-- Content -->
            <div class="p-6 overflow-y-auto custom-scroll bg-slate-50/50 flex-1 min-h-0">
                <div class="bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                    <div class="divide-y divide-slate-50 flex-1 overflow-y-auto custom-scroll max-h-[60vh]">
                        ${sortedEntries.map(e => {
        const remarkStr = e.remark || e.remarks || e.description || '';
        const searchStr = `${e._shopName || ''} ${e.billNo || ''} ${remarkStr}`.replace(/"/g, '&quot;');
        const displayDesc = remarkStr ? '- ' + remarkStr : '';
        return `
                            <div class="misc-item-row px-5 py-3 hover:bg-slate-50/50 transition-colors flex justify-between items-center group" data-search="${searchStr}" data-amount="${e.amount || 0}" data-type="${e.amountType || 'CASH'}">
                                <div class="flex flex-col gap-0.5">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
                                            ${e._shopName}
                                        </span>
                                        <span class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                                            ${new Date(e.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                        ${e.billNo || 'Misc Delivery'} ${displayDesc}
                                    </span>
                                </div>
                                <span class="flex flex-col items-end">
                                    <span class="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-sm group-hover:bg-amber-100 transition-colors">
                                        ${formatCurrency(e.amount)}
                                    </span>
                                    <span class="text-[9px] uppercase tracking-wider text-amber-500/80 mt-0.5 font-bold">${e.amountType || 'CASH'}</span>
                                </span>
                            </div>
                        `}).join('')}
                    </div>
                </div>
                <!-- Empty State -->
                <div id="miscEmptyState" class="${sortedEntries.length === 0 ? 'flex' : 'hidden'} flex-col items-center justify-center py-12 text-center">
                    <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p class="text-slate-500 font-medium">No misc collections matched.</p>
                </div>
            </div>
             <div class="bg-white border-t border-slate-100 p-4 text-center shrink-0">
                <p class="text-xs text-slate-400">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

window.viewProfitDetails = viewProfitDetails;
window.viewGlobalProfitDetails = viewGlobalProfitDetails;
window.viewMiscCollectionDetails = viewMiscCollectionDetails;
window.viewGlobalMiscCollectionDetails = viewGlobalMiscCollectionDetails;
window.openOwnerReportModal = openOwnerReportModal;
window.closeOwnerReportModal = closeOwnerReportModal;
window.printOwnerReport = printOwnerReport;

// Attach global functions

