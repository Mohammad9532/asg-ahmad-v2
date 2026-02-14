
import { state } from './state.js';
import { SHOP_PREFIXES } from './config.js';
import { formatCurrency, calculateCanceledSum, isCanceledStatus, sortArray, getSortIcon } from './utils.js';
import { renderMonthlySummary } from './render_monthly.js';
import { renderStockAuditView } from './stock_audit.js';
import { renderDailyLedger } from './dailyLedger.js';
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

    // Note: Daily Ledger and Stock Audit currently fetch their own data, 
    // we'll handle their caching internally in their files.
    const isInternalFetchView = dataType === 'daily_ledger' || dataType === 'stock_audit';

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
    } else if (dataType === 'daily_ledger') {
        // Defined in dailyLedger.js
        renderDailyLedger(shopPrefix);
    } else {
        // Fallback for other potential types, renders standard table
        renderStandardTable(shopPrefix, data, dataType);
    }
}

function isValidDataTypeForShop(dt) {
    return ['dashboard', 'bookings', 'delivery', 'expense', 'employees', 'monthly_summary', 'stock_audit', 'daily_ledger'].includes(dt);
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
    if (exp && exp.filteredData) {
        shopExp = exp.filteredData.reduce((s, d) => s + (d.amount || 0), 0);
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
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Gross Booking</h3>
                    <p class="text-xl font-bold text-slate-700 mt-1">${formatCurrency(shopGross)}</p>
                </div>
                <!-- 2. Cancel -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Cancelled</h3>
                    <p class="text-xl font-bold text-red-600 mt-1">${formatCurrency(shopCancel)}</p>
                </div>
                <!-- 3. Net -->
                <div class="bg-indigo-50 p-4 rounded-xl shadow border border-indigo-100">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase">Net Booking</h3>
                    <p class="text-xl font-bold text-indigo-900 mt-1">${formatCurrency(shopNet)}</p>
                </div>
                <!-- 4. Deliveries (Accrual) -->
                <div class="bg-blue-50 p-4 rounded-xl shadow border border-blue-100">
                    <h3 class="text-xs font-semibold text-blue-800 uppercase tracking-tighter">Del (Accrual)</h3>
                    <p class="text-xl font-bold text-blue-900 mt-1">${formatCurrency(accrualDeliveryAmount)}</p>
                </div>
                <!-- 5. Expenses -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h3 class="text-xs font-semibold text-slate-500 uppercase">Expenses</h3>
                    <p class="text-xl font-bold text-red-600 mt-1">${formatCurrency(shopExp)}</p>
                </div>
                
                <!-- 6. Profit -->
                <div class="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase">Est. Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-bold text-emerald-900">${formatCurrency(profit)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-cyan-50 p-4 rounded-xl shadow-sm border border-cyan-100">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-bold text-cyan-900">${formatCurrency(oldCollection)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase">Misc Collections</h3>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-bold text-amber-900">${formatCurrency(shopMiscDel)}</p>
                </div>
                <!-- 9. Total Balance -->
                <div class="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-bold text-indigo-900">${formatCurrency(totalBalance)}</p>
                </div>
                <!-- 10. Stock Available -->
                <div class="bg-teal-50 p-4 rounded-xl shadow-sm border border-teal-100">
                    <h3 class="text-xs font-semibold text-teal-800 uppercase">Stock Available</h3>
                    <p class="text-xs text-teal-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-bold text-teal-900">${formatCurrency(stock)}</p>
                </div>
                <!-- 10. Stock Percentage -->
                <div class="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-100">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-bold text-purple-700">${stockPercent.toFixed(1)}%</p>
                </div>
            </div>

            <!-- Charts Area -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Daily Trend -->
                <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                    <h4 class="font-bold text-slate-700 mb-2 text-sm">Daily Net Booking Trend</h4>
                    <div class="h-60 relative w-full">
                        <canvas id="shopTrendChart"></canvas>
                    </div>
                </div>
                    <!-- Payment Methods -->
                    <div class="bg-white p-4 rounded-xl shadow border border-slate-200">
                        <h4 class="font-bold text-slate-700 mb-2 text-sm">Delivery Payment Methods</h4>
                        <div class="flex flex-col md:flex-row items-center h-60 w-full">
                        <div class="relative w-full md:w-1/2 h-full flex justify-center">
                            <canvas id="shopPaymentChart"></canvas>
                        </div>
                        <div class="w-full md:w-1/2 p-4">
                            ${renderLegendHTML(paymentMethods, shopDel)}
                        </div>
                        </div>
                    </div>
            </div>

            <!-- Monthly Summary Reuse -->
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
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
    let totalBookingDeliveries = 0, totalMiscDeliveries = 0, totalAccrualDeliveries = 0, totalExpenses = 0;
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

        // Expenses
        const exp = getMetric('expense');
        const shopExp = exp ? (exp.totalAmount || 0) : 0;
        totalExpenses += shopExp;

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
                    <!-- 4. Deliveries Accrual -->
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm border border-blue-200">
                    <h3 class="text-xs font-semibold text-blue-800 uppercase tracking-wider">Del (Accrual)</h3>
                    <p class="text-xl font-extrabold text-blue-900 mt-1">${formatCurrency(totalAccrualDeliveries)}</p>
                </div>
                    <!-- 5. Expenses -->
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl shadow-sm border border-pink-200">
                    <h3 class="text-xs font-semibold text-pink-800 uppercase tracking-wider">Total Expenses</h3>
                    <p class="text-xl font-extrabold text-pink-900 mt-1">${formatCurrency(totalExpenses)}</p>
                </div>
                
                <!-- 6. Profit -->
                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl shadow-sm border border-emerald-200">
                    <h3 class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Estimate Profit</h3>
                    <p class="text-xs text-emerald-600 mb-1">(Accrual Del - Exp)</p>
                    <p class="text-xl font-extrabold text-emerald-900">${formatCurrency(estimateProfit)}</p>
                </div>
                <!-- 7. Old Collection -->
                <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl shadow-sm border border-cyan-200">
                    <h3 class="text-xs font-semibold text-cyan-800 uppercase tracking-wider">Old Booking Coll.</h3>
                    <p class="text-xs text-cyan-600 mb-1">(Booking Del - Accrual)</p>
                    <p class="text-xl font-extrabold text-cyan-900">${formatCurrency(totalOldCollection)}</p>
                </div>
                <!-- 8. Misc Collections -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Misc Collections</h3>
                    <p class="text-xs text-amber-600 mb-1">(Rent, Advance, etc.)</p>
                    <p class="text-xl font-extrabold text-amber-900">${formatCurrency(totalMiscDeliveries)}</p>
                </div>
                <!-- 9. Total Balance -->
                    <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm border border-indigo-200">
                    <h3 class="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Total Balance</h3>
                    <p class="text-xs text-indigo-600 mb-1">(Total Del - Exp)</p>
                    <p class="text-xl font-extrabold text-indigo-900">${formatCurrency(totalBalanceGlobal)}</p>
                </div>
                    <!-- 10. Stock Accrual -->
                <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm border border-amber-200">
                    <h3 class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Stock Available</h3>
                    <p class="text-xs text-amber-600 mb-1">(Net - Accrual Del)</p>
                    <p class="text-xl font-extrabold text-amber-900">${formatCurrency(stockAvailable)}</p>
                </div>
                <!-- 11. Stock Percent -->
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm border border-purple-200">
                    <h3 class="text-xs font-semibold text-purple-800 uppercase tracking-wider">Stock %</h3>
                    <p class="text-xs text-purple-600 mb-1">(Uncollected %)</p>
                    <p class="text-xl font-extrabold text-purple-900">${totalStockPercent.toFixed(1)}%</p>
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
            <div class="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
                <div class="px-6 py-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
                    <h3 class="font-bold text-slate-800 text-sm">Shop Leaderboard</h3>
                </div>
                <div class="overflow-y-auto custom-scroll">
                    <table class="w-full text-sm text-center relative">
                        <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
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
                        <tbody class="divide-y divide-slate-100">
                            ${shopPerformance.map(p => {
        const profit = p.accDel - p.exp;
        const oldColl = p.del - p.accDel;
        const totalBalance = p.del - p.exp;
        const stockAcc = p.net - p.accDel;
        const stockPercent = p.net > 0 ? (stockAcc / p.net) * 100 : 0;

        return `
                                    <tr class="hover:bg-slate-50 transition-colors">
                                        <td class="px-2 py-3 text-left font-medium text-slate-900 truncate max-w-[120px]" title="${p.shop}">${p.shop}</td>
                                        <td class="px-2 py-3 text-right text-slate-500">${formatCurrency(p.gross)}</td>
                                        <td class="px-2 py-3 text-right text-red-500">${formatCurrency(p.cancel)}</td>
                                        <td class="px-2 py-3 text-right font-semibold text-slate-700">${formatCurrency(p.net)}</td>
                                        <td class="px-2 py-3 text-right text-blue-600 font-medium">${formatCurrency(p.accDel)}</td>
                                        <td class="px-2 py-3 text-right text-red-600">${formatCurrency(p.exp)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}">${formatCurrency(profit)}</td>
                                        <td class="px-2 py-3 text-right font-medium text-cyan-600">${formatCurrency(oldColl)}</td>
                                        <td class="px-2 py-3 text-right font-bold text-indigo-700">${formatCurrency(totalBalance)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${stockAcc >= 0 ? 'text-amber-600' : 'text-red-500'}">${formatCurrency(stockAcc)}</td>
                                        <td class="px-2 py-3 text-right font-bold ${stockPercent > 0 ? 'text-purple-600' : 'text-emerald-600'}">${stockPercent.toFixed(1)}%</td>
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

    if (deliveryData.filteredData.length === 0) {
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

    if (expenseData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No expense data found in the selected date range.</p>';
        return;
    }

    const tableId = `${shopPrefix}_daily_expense`;
    const categoriesSet = new Set();
    const dailyAggregatesMap = new Map();

    expenseData.filteredData.forEach(doc => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        const cat = doc.dept || 'Uncategorized';
        categoriesSet.add(cat);
        const amount = doc.amount || 0;

        if (!dailyAggregatesMap.has(dateStr)) {
            dailyAggregatesMap.set(dateStr, { dateStr, total: 0, count: 0, breakdown: {} });
        }
        const day = dailyAggregatesMap.get(dateStr);
        day.total += amount;
        day.count += 1;
        day.breakdown[cat] = (day.breakdown[cat] || 0) + amount;
    });

    const categories = Array.from(categoriesSet).sort();
    let dailyData = Array.from(dailyAggregatesMap.values());
    const currentSort = state.sortState[tableId];
    if (currentSort) dailyData = sortArray(dailyData, currentSort.key, currentSort.dir);
    else dailyData = sortArray(dailyData, 'dateStr', 'asc');

    const breakdown = expenseData.categoryTotals || {};
    const total = expenseData.totalAmount || 0;

    let finalHtml = `
        <div class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="stat-card bg-red-50 p-6 rounded-xl border border-red-100">
                    <p class="text-xs font-bold text-red-600 uppercase mb-2">Total Expense</p>
                    <p class="text-3xl font-black text-red-700">${formatCurrency(total)}</p>
                </div>
                ${Object.entries(breakdown).slice(0, 3).map(([key, val]) => `
                    <div class="stat-card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <p class="text-xs font-bold text-slate-500 uppercase mb-2">${key}</p>
                        <p class="text-xl font-bold text-slate-700">${formatCurrency(val)}</p>
                    </div>
                `).join('')}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">Daily Expense Trend (By Department)</h3>
                ${renderDailyCategoryTrendTable(dailyData, categories, 'Expenses', tableId)}
            </div>
            <div>
                <h3 class="text-xl font-bold mb-4">All Expense Records</h3>
                ${renderStandardTable(shopPrefix, expenseData, 'expense', false)}
            </div>
        </div>
    `;

    container.innerHTML = finalHtml;
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

    const employees = data.employees;

    // Calculate Summary Stats
    const totalEmployees = employees.length;
    let totalSalaries = 0;
    let activeCount = 0;

    const cardsHtml = employees.map(emp => {
        const salary = emp.total || 0;
        totalSalaries += salary;
        const status = emp.status || 'active';
        if (status === 'active') activeCount++;

        return `
        <div class="employee-card bg-white rounded-xl shadow border border-slate-200 p-4 hover:shadow-md transition-shadow relative group cursor-pointer" 
             data-name="${emp.name.toLowerCase()}"
             onclick="viewEmployeeHistory('${shopPrefix}', '${emp.name}')">
            <div class="flex items-center space-x-4">
               <div class="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    ${emp.name.charAt(0).toUpperCase()}
               </div>
               <div>
                   <h4 class="font-bold text-slate-800">${emp.name}</h4>
                   <p class="text-xs text-slate-500">${emp.designation || 'Staff Member'}</p>
               </div>
            </div>
            <div class="mt-4 border-t border-slate-100 pt-3">
                 <div class="flex justify-between text-sm mb-1">
                    <span class="text-slate-500">Period Earnings</span>
                    <span class="font-semibold text-slate-700">${formatCurrency(salary)}</span>
                 </div>
                 <div class="flex justify-between text-sm">
                    <span class="text-slate-500">Records</span>
                    <span class="font-semibold text-slate-700">${emp.count || 0} entries</span>
                 </div>
            </div>
        </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Summary Header -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <p class="text-xs text-indigo-600 uppercase font-semibold">Total Staff</p>
                     <p class="text-2xl font-bold text-indigo-900">${totalEmployees}</p>
                 </div>
                 <div class="bg-green-50 p-4 rounded-xl border border-green-100">
                     <p class="text-xs text-green-600 uppercase font-semibold">Active Now</p>
                     <p class="text-2xl font-bold text-green-900">${activeCount}</p>
                 </div>
                 <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                     <p class="text-xs text-slate-500 uppercase font-semibold">Total Payroll (Basic)</p>
                     <p class="text-2xl font-bold text-slate-700">${formatCurrency(totalSalaries)}</p>
                 </div>
            </div>

            <!-- Search Bar -->
            <div class="relative">
                 <input type="text" placeholder="Search employees..." 
                    class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
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

    // Expose filter function to global scope for the oninput handler
    // Actually we imported `filterEmployeeGrid` from UI.
    // Wait, the `oninput = "filterEmployeeGrid(this.value)"` assumes global function.
    // We should attach it to window in UI.js or duplicate logic here.
    // Since we imported UI logic, `ui.js` has `filterEmployeeGrid`.
    if (typeof window.filterEmployeeGrid === 'undefined') {
        // It should be attached in ui.js or main.js. 
        // Assuming main.js handles linking, or I should reference it if I can.
        // But in module HTML, string handlers need global access.
        // I'll make sure main.js or ui.js attaches it.
        // For now, I'll rely on it being global.
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
                            <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                <thead class="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300">
                                    <tr>
                                        <th class="px-6 py-3">Date</th>
                                        <th class="px-6 py-3">Category</th>
                                        <th class="px-6 py-3">Reference/Note</th>
                                        <th class="px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                                    ${history.map(row => `
                                        <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td class="px-6 py-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                                                ${new Date(row.date).toLocaleDateString()}
                                            </td>
                                            <td class="px-6 py-4">
                                                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    ${row.cat || 'General'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                                                ${row.description || row.dept || '-'}
                                            </td>
                                            <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                ${formatCurrency(row.amount)}
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
        <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${colors[key]}"></span>
                        <span class="text-slate-600 font-medium">${labels[key]}</span>
                    </div>
                    <div class="flex items-center text-slate-700">
                        <span class="font-bold mr-2">${formatCurrency(val)}</span>
                        <span class="text-xs text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">${percent}%</span>
                    </div>
                </div>
        `;
        }
    }
    html += '</div>';
    return html;
}


// Helper functions (inline replacement of utils needed if not imported, but we imported them)

// Attach global functions
window.renderContent = renderContent;

