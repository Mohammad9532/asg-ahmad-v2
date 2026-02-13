// --- MAIN CONTENT RENDERING & CHARTS ---

// Global chart instances to destroy before re-rendering
if (typeof chartInstances === 'undefined') {
    var chartInstances = {}; // use var to avoid redeclaration issues if scripts reloaded
}

function renderContent(shopPrefix, dataType) {
    const container = document.getElementById('dataTypeContentContainer');
    const statusMessage = document.getElementById('statusMessage');
    const dataTypeTabs = document.getElementById('dataTypeTabsContainer');

    if (!container) return;

    // Show Skeleton and yield for paint
    container.innerHTML = '';
    const skeleton = document.getElementById('skeletonLoader');
    const skeletonDash = document.getElementById('skeletonDashboard');
    const skeletonTable = document.getElementById('skeletonTable');

    if (skeleton) {
        skeleton.classList.remove('hidden');
        // Hide all specific ones first
        if (skeletonDash) skeletonDash.classList.add('hidden');
        if (skeletonTable) skeletonTable.classList.add('hidden');

        // Show the relevant one
        if (dataType === 'dashboard' || shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE') {
            if (skeletonDash) skeletonDash.classList.remove('hidden');
        } else {
            if (skeletonTable) skeletonTable.classList.remove('hidden');
        }
    }
    if (statusMessage) statusMessage.classList.add('hidden');

    // Yield to let the skeleton paint
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
        if (Object.keys(allResults).length === 0) {
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
        renderCustomerDirectory(); // Defined in customers.js
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

        if (!allResults[bookingsKey] || !allResults[deliveryKey] || !allResults[expenseKey]) {
            if (statusMessage) {
                statusMessage.textContent = `Error: Core data (Bookings, Deliveries, or Expenses) needed for the Monthly Summary is missing. Please click 'Fetch All Shop Data'.`;
                statusMessage.classList.remove('hidden');
            }
            return;
        }
        // Check if any of the core data results show an API error.
        if (allResults[bookingsKey].isError || allResults[deliveryKey].isError || allResults[expenseKey].isError) {
            container.innerHTML = `
                <div class="p-6 bg-red-100 text-red-800 rounded-xl shadow-lg border border-red-300">
                    <p class="font-bold">Error: Monthly Summary cannot be calculated due to API errors in core data types:</p>
                    <ul class="list-disc ml-5 mt-2 text-sm">
                        ${allResults[bookingsKey].isError ? `<li>Bookings: ${allResults[bookingsKey].errorMessage}</li>` : ''}
                        ${allResults[deliveryKey].isError ? `<li>Deliveries: ${allResults[deliveryKey].errorMessage}</li>` : ''}
                        ${allResults[expenseKey].isError ? `<li>Expenses: ${allResults[expenseKey].errorMessage}</li>` : ''}
                    </ul>
                    <p class="mt-3 text-sm font-semibold">Action: Check the backend server for these specific routes.</p>
                </div>`;
            return;
        }
    }

    const data = allResults[key]; // This will be undefined for monthly_summary, which is fine.

    if (dataType === 'dashboard') {
        renderShopDashboard(shopPrefix, container);
    } else if (dataType === 'bookings') {
        renderNetBookingDetails(shopPrefix, data);
    } else if (dataType === 'delivery') {
        renderDeliveryByTypeDetails(shopPrefix, data);
    } else if (dataType === 'expense') {
        renderExpenseByTypeDetails(shopPrefix, data);
    } else if (dataType === 'employees') {
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
    const bk = allResults[`${shop}|bookings`];
    const exp = allResults[`${shop}|expense`];
    const del = allResults[`${shop}|delivery`];

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
    const accrualData = allResults[`${shop}|accrual_delivery`];
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
    if (chartInstances.shopTrend) chartInstances.shopTrend.destroy();
    if (chartInstances.shopPay) chartInstances.shopPay.destroy();

    const ctx1 = document.getElementById('shopTrendChart').getContext('2d');
    chartInstances.shopTrend = new Chart(ctx1, {
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
    chartInstances.shopPay = new Chart(ctx2, {
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
        // Bookings Data
        const bk = allResults[`${shop}|bookings`];
        const shopGross = bk ? (bk.totalAmount || 0) : 0;

        // Use pre-calculated net if available, otherwise reduce (for shop-specific lazy load)
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
        const del = allResults[`${shop}|delivery`];
        let shopDel = 0;
        let shopBookingDel = 0;
        let shopMiscDel = 0;

        if (del) {
            shopDel = del.totalAmount || 0;

            // Use pre-calculated breakdowns
            if (del.paymentMethods) {
                shopBookingDel = del.bookingDel || 0;
                shopMiscDel = del.miscDel || 0;

                paymentMethods.CASH += (del.paymentMethods.CASH || 0);
                paymentMethods.ADIB += (del.paymentMethods.ADIB || 0);
                paymentMethods.ATM += (del.paymentMethods.ATM || 0);
            } else if (del.filteredData) {
                // Fallback for lazy-loaded shop data
                del.filteredData.forEach(d => {
                    const amt = d.amount || 0;
                    const bNo = (d.billNo || '').toLowerCase().trim();

                    if (bNo && bNo !== 'other-amounts') {
                        shopBookingDel += amt;
                    } else {
                        shopMiscDel += amt;
                    }

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

        // Accrual Delivery Total (specifically for Profit/Stock)
        const accData = allResults[`${shop}|accrual_delivery`];
        const shopAccDel = accData ? (accData.totalAccrualAmount || 0) : 0;
        totalAccrualDeliveries += shopAccDel;
        // ... rest of loop
        const exp = allResults[`${shop}|expense`];
        const shopExp = exp ? (exp.totalAmount || 0) : 0;
        totalExpenses += shopExp;

        // Lifetime Data
        const lifeData = allResults[`${shop}|lifetime`];
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
    if (chartInstances.perf) chartInstances.perf.destroy();
    if (chartInstances.pay) chartInstances.pay.destroy();

    const ctx1 = document.getElementById('shopPerformanceChart').getContext('2d');
    chartInstances.perf = new Chart(ctx1, {
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
    chartInstances.pay = new Chart(ctx2, {
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

function renderNetBookingDetails(shopPrefix, bookingData) {
    const container = document.getElementById('dataTypeContentContainer');

    const totalBookings = getTotalBookingsAmount(shopPrefix);
    const totalCanceled = getTotalCanceledAmount(shopPrefix);
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
    container.innerHTML += summaryBlock;

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

        if (isCanceled) {
            acc[dateStr].canceled += amount;
        }

        return acc;
    }, {});

    // Finalize net calculation for each day and sort
    let dailyData = Object.keys(dailyAggregates)
        .map(dateStr => {
            const daily = dailyAggregates[dateStr];
            daily.net = daily.gross - daily.canceled;
            return { dateStr, ...daily };
        });

    // Apply sorting
    const tableId = `${shopPrefix}_daily_bookings`;
    const currentSort = sortState[tableId];
    if (currentSort) {
        dailyData = sortArray(dailyData, currentSort.key, currentSort.dir);
    } else {
        dailyData = sortArray(dailyData, 'dateStr', 'asc');
    }

    container.innerHTML += `<h3 class="text-xl font-bold mt-8 mb-4">Daily Net Booking Trend (${dateRange.start} to ${dateRange.end})</h3>`;
    container.innerHTML += renderDailyNetBookingTable(dailyData, 'Bookings', tableId);

    // Detailed Table 
    container.innerHTML += `<h3 class="text-xl font-bold mt-8 mb-4">All Booking Records (Gross & Canceled)</h3>`;
    container.innerHTML += renderStandardTable(shopPrefix, bookingData, 'bookings', true);
}


function renderDeliveryByTypeDetails(shopPrefix, deliveryData) {
    const container = document.getElementById('dataTypeContentContainer');

    if (deliveryData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No delivery data found in the selected date range.</p>';
        return;
    }

    // 1. Identify all unique categories in this specific dataset
    const allCategoriesSet = new Set();
    deliveryData.filteredData.forEach(doc => {
        let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
        allCategoriesSet.add(type);
    });

    const DELIVERY_CATEGORIES = ['CASH', 'ADIB', 'ATM'];

    // Day-wise Aggregation for Deliveries (Multi-Category)
    // Create a local version of the data with standardized types for the trend table
    const standardizedData = deliveryData.filteredData.map(doc => {
        let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';
        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';

        let detailedType;
        const bNo = (doc.billNo || '').toLowerCase().trim();
        if (bNo && bNo !== 'other-amounts') {
            detailedType = type;
        } else {
            detailedType = (doc.remarks || doc.name || 'MISC').toUpperCase().trim();
        }

        return { ...doc, amountTypeStandardized: type, detailedType };
    });

    let dailyAggregates = aggregateDailyCategories(standardizedData, 'amountTypeStandardized');

    // Apply sorting
    const tableId = `${shopPrefix}_daily_deliveries`;
    const currentSort = sortState[tableId];
    if (currentSort) {
        dailyAggregates = sortArray(dailyAggregates, currentSort.key, currentSort.dir);
    } else {
        dailyAggregates = sortArray(dailyAggregates, 'dateStr', 'asc');
    }

    const grandTotal = deliveryData.filteredData.reduce((sum, doc) => sum + (doc.amount || 0), 0);

    let html = `
        <div class="bg-teal-50 p-4 rounded-xl shadow-md text-center mb-6 border-2 border-teal-200">
            <p class="text-sm text-gray-600 font-medium">DELIVERIES GRAND TOTAL</p>
            <p class="text-2xl font-extrabold text-teal-700">${formatCurrency(grandTotal)}</p>
        </div>
        <h3 class="text-xl font-bold mb-4">Daily Delivery Trend by Type (${dateRange.start} to ${dateRange.end})</h3>
        ${renderDailyCategoryTrendTable(dailyAggregates, DELIVERY_CATEGORIES, 'Deliveries', tableId)}
        <h3 class="text-xl font-bold mt-8 mb-4">Delivery Payments by Type</h3>
    `;

    // Grouping
    const groups = standardizedData.reduce((acc, doc) => {
        const type = doc.detailedType;
        if (!acc[type]) {
            acc[type] = { docs: [], total: 0 };
        }
        acc[type].docs.push(doc);
        acc[type].total += (doc.amount || 0);
        return acc;
    }, {});

    Object.keys(groups).sort((a, b) => {
        const aIdx = DELIVERY_CATEGORIES.indexOf(a);
        const bIdx = DELIVERY_CATEGORIES.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
    }).forEach(type => {
        const group = groups[type];

        html += `<div class="mt-6 border-t pt-4">
            <h4 class="text-lg font-semibold text-teal-700">${type} Total: ${formatCurrency(group.total)}</h4>
        </div>`;

        html += renderStandardTable(shopPrefix, { filteredData: group.docs, totalAmount: group.total }, 'delivery', false);
    });

    container.innerHTML = html;
}

function renderExpenseByTypeDetails(shopPrefix, expenseData) {
    const container = document.getElementById('dataTypeContentContainer');

    if (expenseData.filteredData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No expense data found in the selected date range.</p>';
        return;
    }

    // Day-wise Aggregation
    let dailyAggregates = aggregateDailyCategories(expenseData.filteredData, 'cat');

    let uniqueCategories = new Set();
    expenseData.filteredData.forEach(doc => {
        if (doc.cat) uniqueCategories.add(doc.cat.toUpperCase());
    });
    const EXPENSE_CATEGORIES = Array.from(uniqueCategories).sort();

    // Apply sorting
    const tableId = `${shopPrefix}_daily_expenses`;
    const currentSort = sortState[tableId];
    if (currentSort) {
        dailyAggregates = sortArray(dailyAggregates, currentSort.key, currentSort.dir);
    } else {
        dailyAggregates = sortArray(dailyAggregates, 'dateStr', 'asc');
    }

    const grandTotal = expenseData.filteredData.reduce((sum, doc) => sum + (doc.amount || 0), 0);

    let html = `
        <div class="bg-red-50 p-4 rounded-xl shadow-md text-center mb-6 border-2 border-red-200">
            <p class="text-sm text-gray-600 font-medium">EXPENSES GRAND TOTAL</p>
            <p class="text-2xl font-extrabold text-red-700">${formatCurrency(grandTotal)}</p>
        </div>
        <h3 class="text-xl font-bold mb-4">Daily Expense Trend by Category (${dateRange.start} to ${dateRange.end})</h3>
        ${renderDailyCategoryTrendTable(dailyAggregates, EXPENSE_CATEGORIES, 'Expenses', tableId)}
        <h3 class="text-xl font-bold mt-8 mb-4">Expenses by Category</h3>
    `;

    const groups = expenseData.filteredData.reduce((acc, doc) => {
        const category = doc.cat ? doc.cat.toUpperCase() : 'UNCATEGORIZED';
        if (!acc[category]) {
            acc[category] = { docs: [], total: 0 };
        }
        acc[category].docs.push(doc);
        acc[category].total += (doc.amount || 0);
        return acc;
    }, {});

    Object.keys(groups).sort().forEach(category => {
        const group = groups[category];

        html += `<div class="mt-6 border-t pt-4">
            <h4 class="text-lg font-semibold text-red-700">${category} Total: ${formatCurrency(group.total)}</h4>
        </div>`;

        html += renderStandardTable(shopPrefix, { filteredData: group.docs, totalAmount: group.total }, 'expense', false);
    });

    container.innerHTML = html;
}

/**
 * Renders the Employee Summary and List
 */
async function renderEmployeeSection(shopPrefix, container) {
    const data = allResults[`${shopPrefix}|employee`];

    if (!data || data.isError) {
        const errorMsg = data?.errorMessage || "No employee data found in this period.";
        container.innerHTML = `
            <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p class="text-3xl mb-4">👥</p>
                <p class="text-slate-500 font-bold">${errorMsg}</p>
                <button onclick="fetchShopData('${shopPrefix}')" class="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Refresh Data</button>
            </div>
        `;
        return;
    }

    if (!data.length) {
        container.innerHTML = `
            <div class="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p class="text-3xl mb-4">👥</p>
                <p class="text-slate-500 font-bold text-sm uppercase tracking-tight">No employee records found</p>
                <p class="text-xs text-slate-400 mt-1">Employee data is generated from recorded expenses.</p>
            </div>
        `;
        return;
    }

    const totalMoneyTaken = data.reduce((sum, e) => sum + (e.total || 0), 0);

    let html = `
        <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Money Taken</p>
                <p class="text-3xl font-black text-indigo-900 dark:text-white mt-1">${formatCurrency(totalMoneyTaken)}</p>
            </div>
            <div class="bg-emerald-50 dark:bg-emerald-900/30 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-sm">
                <p class="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Employees</p>
                <p class="text-3xl font-black text-emerald-900 dark:text-white mt-1">${data.length}</p>
            </div>
            <div class="md:col-span-1 flex items-end">
                <div class="w-full relative">
                    <input type="text" id="employeeSearch" placeholder="Search employee..." 
                           oninput="filterEmployeeGrid(this.value)"
                           class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm">
                    <span class="absolute right-4 top-3 text-slate-400">🔍</span>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="employeeGrid">
            ${data.map(emp => {
        // Escape single quotes for the onclick handler
        const safeName = emp.name.replace(/'/g, "\\'");
        return `
                <div class="employee-card bg-white dark:bg-slate-700/50 p-5 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group shadow-sm hover:shadow-md" 
                     data-name="${emp.name.toLowerCase()}"
                     onclick="viewEmployeeHistory('${shopPrefix}', '${safeName}')">
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            ${(emp.name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <span class="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full font-bold">
                            ${emp.count} Entries
                        </span>
                    </div>
                    <h4 class="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${emp.name}</h4>
                    <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">${formatCurrency(emp.total)}</p>
                    <div class="mt-4 flex items-center text-xs font-semibold text-slate-400 group-hover:text-indigo-500 transition-colors">
                        View History
                        <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;

    container.innerHTML = html;
}

/**
 * Fetches and renders detailed history for a specific employee
 */
async function viewEmployeeHistory(shopPrefix, employeeName) {
    showLoading(true);
    const container = document.getElementById('dataTypeContentContainer');

    try {
        const response = await fetch(`${BASE_URL}/api/${shopPrefix}/employee/history?name=${encodeURIComponent(employeeName)}&start=${dateRange.start}&end=${dateRange.end}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (!response.ok) throw new Error("Failed to fetch history");
        const history = await response.json();

        const total = history.reduce((sum, h) => sum + (h.amount || 0), 0);

        let html = `
            <div class="mb-6 flex items-center justify-between">
                <button onclick="renderContent('${shopPrefix}', 'employees')" class="flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                    <svg class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to List
                </button>
                <div class="text-right">
                    <h3 class="text-2xl font-black text-slate-800 dark:text-white">${employeeName}</h3>
                    <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400">Total: ${formatCurrency(total)}</p>
                </div>
            </div>

            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description / Remarks</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        ${history.map(item => `
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-sm">
                                <td class="p-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">${new Date(item.date).toLocaleDateString()}</td>
                                <td class="p-4">
                                    <span class="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase">
                                        ${item.cat || 'Misc'}
                                    </span>
                                </td>
                                <td class="p-4 text-slate-700 dark:text-slate-200">${item.remarks || item.desc || '-'}</td>
                                <td class="p-4 text-right font-bold text-slate-900 dark:text-white">${formatCurrency(item.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    } catch (error) {
        logError(error.message);
    } finally {
        showLoading(false);
    }
}

function aggregateDailyCategories(filteredData, typeField) {
    const dailyAggregates = filteredData.reduce((acc, doc) => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        const type = doc[typeField] ? doc[typeField].toUpperCase() : 'OTHER';
        const amount = doc.amount || 0;

        if (!acc[dateStr]) {
            acc[dateStr] = { dateStr: dateStr, total: 0, count: 0, breakdown: {} };
        }

        acc[dateStr].total += amount;
        acc[dateStr].count += 1;

        if (!acc[dateStr].breakdown[type]) {
            acc[dateStr].breakdown[type] = 0;
        }
        acc[dateStr].breakdown[type] += amount;

        return acc;
    }, {});

    return Object.values(dailyAggregates);
}
