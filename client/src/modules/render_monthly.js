import { state } from './state.js';
import { formatCurrency, isCanceledStatus, sortArray, getSortIcon } from './utils.js';


// --- MONTHLY SUMMARY RENDERING ---

/**
 * Aggregates data by month across all data types.
 */
function aggregateMonthlyData(shopPrefix) {
    // This function relies on 'bookings', 'delivery', and 'expense' being present in state.allResults
    const allBookings = state.allResults[`${shopPrefix}|bookings`]?.filteredData || [];
    const allDeliveries = state.allResults[`${shopPrefix}|delivery`]?.filteredData || [];
    const allExpenses = state.allResults[`${shopPrefix}|expense`]?.filteredData || [];

    const monthlyData = {}; // Key: "YYYY-MM"

    // 1. Process Bookings
    allBookings.forEach(doc => {
        const date = new Date(doc.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = doc.amount || 0;
        const isCanceled = isCanceledStatus(doc.status);

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                gross: 0, canceled: 0, net: 0,
                delivery: { total: 0, breakdown: {} },
                expense: 0
            };
        }

        monthlyData[monthKey].gross += amount;
        if (isCanceled) {
            monthlyData[monthKey].canceled += amount;
        }
        monthlyData[monthKey].net = monthlyData[monthKey].gross - monthlyData[monthKey].canceled;
    });

    // 2. Process Deliveries
    allDeliveries.forEach(doc => {
        const date = new Date(doc.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = doc.amount || 0;

        // REFINED CATEGORIZATION LOGIC:
        // Use amountType if billNo exists and is not 'other-amounts', 
        // otherwise use remarks/name for miscellaneous items
        const bNo = (doc.billNo || '').toLowerCase().trim();
        let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

        // Standardize card payment labels
        if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) {
            type = 'ADIB';
        }

        if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                gross: 0, canceled: 0, net: 0,
                delivery: { total: 0, bookingTotal: 0, miscTotal: 0, breakdown: {} },
                expense: 0
            };
        }

        if (!monthlyData[monthKey].delivery.breakdown) {
            monthlyData[monthKey].delivery.breakdown = {};
            monthlyData[monthKey].delivery.bookingTotal = 0;
            monthlyData[monthKey].delivery.miscTotal = 0;
        }

        monthlyData[monthKey].delivery.total += amount;

        if (bNo && bNo !== 'other-amounts') {
            monthlyData[monthKey].delivery.bookingTotal += amount;
        } else {
            monthlyData[monthKey].delivery.miscTotal += amount;
        }

        if (!monthlyData[monthKey].delivery.breakdown[type]) {
            monthlyData[monthKey].delivery.breakdown[type] = 0;
        }
        monthlyData[monthKey].delivery.breakdown[type] += amount;
    });

    // 3. Process Expenses
    allExpenses.forEach(doc => {
        const date = new Date(doc.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = doc.amount || 0;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                gross: 0, canceled: 0, net: 0,
                delivery: { total: 0, breakdown: {} },
                expense: 0
            };
        }
        monthlyData[monthKey].expense += amount;
    });

    // Convert to sorted array
    return Object.keys(monthlyData)
        .sort()
        .map(monthYear => ({
            monthYear,
            ...monthlyData[monthYear]
        }));
}


export function renderMonthlySummary(shopPrefix) {
    const container = document.getElementById('dataTypeContentContainer');
    const monthlyData = aggregateMonthlyData(shopPrefix);

    if (monthlyData.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 mt-8">No data found across bookings, deliveries, or expenses for the monthly summary in the selected range.</p>';
        return;
    }

    // Export Button
    container.innerHTML = `
        <div class="flex justify-end mb-4">
            <button 
                onclick="exportMonthlySummaryToCSV('${shopPrefix}')" 
                class="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-lg"
            >
                Export Monthly Report to CSV (Excel Format)
            </button>
        </div>
    `;

    // Render Bookings Summary
    container.innerHTML += renderMonthlyBookingsTable(monthlyData, shopPrefix);

    // Render Deliveries Summary
    container.innerHTML += `<h3 class="text-xl font-bold mt-8 mb-4 border-b pb-2 text-teal-700">Monthly Delivery Total</h3>`;
    container.innerHTML += renderMonthlyDeliveriesTable(monthlyData, shopPrefix);

    // Render Expenses Summary
    container.innerHTML += `<h3 class="text-xl font-bold mt-8 mb-4 border-b pb-2 text-red-700">Monthly Expense Total</h3>`;
    container.innerHTML += renderMonthlyExpensesTable(monthlyData, shopPrefix);
}

function renderMonthlyBookingsTable(monthlyData, shopPrefix) {
    const tableId = `${shopPrefix}_monthly_bookings`;
    const currentSort = state.sortState[tableId];

    if (currentSort) {
        monthlyData = sortArray([...monthlyData], currentSort.key, currentSort.dir);
    }

    let grandTotalGross = 0;
    let grandTotalCanceled = 0;
    let grandTotalNet = 0;

    const rows = monthlyData.map(item => {
        const [year, month] = item.monthYear.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

        const gross = item.gross || 0;
        const canceled = item.canceled || 0;
        const net = item.net || 0;

        grandTotalGross += gross;
        grandTotalCanceled += canceled;
        grandTotalNet += net;

        const netColorClass = net >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';
        const grossColorClass = gross >= 0 ? 'text-teal-700' : 'text-red-700-bold';

        return `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${monthName} ${year}</td>
            <td class="px-6 py-3 text-right ${grossColorClass}">${formatCurrency(gross)}</td>
            <td class="px-6 py-3 text-right text-red-700-bold">${formatCurrency(canceled)}</td>
            <td class="px-6 py-3 text-right ${netColorClass} bg-green-100/50">${formatCurrency(net)}</td>
                <td class="px-6 py-3 text-center">
                <button onclick="downloadMonthlyExcel('${shopPrefix}', '${item.monthYear}')" class="text-green-600 hover:text-green-800 transition-colors" title="Download Excel">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
            </td>
        </tr>`;
    }).join('');

    return `
    <div id="${tableId}_container">
        <h3 class="text-xl font-bold mb-4 border-b pb-2 text-teal-700">Monthly Booking Report (Gross, Canceled, Net)</h3>
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg mb-8 shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${tableId}', renderMonthlySummary)">
                            Month / Year ${getSortIcon('monthYear', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('gross', '${tableId}', renderMonthlySummary)">
                            Gross Bookings ${getSortIcon('gross', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right text-red-700-bold sortable-header" onclick="handleSort('canceled', '${tableId}', renderMonthlySummary)">
                            Canceled/Deducted ${getSortIcon('canceled', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right bg-green-100/50 text-green-700-bold sortable-header" onclick="handleSort('net', '${tableId}', renderMonthlySummary)">
                            Net Booking Total ${getSortIcon('net', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-center">Export</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Totals</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-teal-700">${formatCurrency(grandTotalGross)}</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-red-700-bold">${formatCurrency(grandTotalCanceled)}</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-green-700-bold bg-green-100/50">${formatCurrency(grandTotalNet)}</th>
                        <th scope="col" class="px-6 py-3"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
`;
}

function renderMonthlyDeliveriesTable(monthlyData, shopPrefix) {
    const tableId = `${shopPrefix}_monthly_deliveries`;

    // 1. Identify all unique categories across all months
    const allCategoriesSet = new Set();
    monthlyData.forEach(item => {
        if (item.delivery && item.delivery.breakdown) {
            Object.keys(item.delivery.breakdown).forEach(cat => allCategoriesSet.add(cat));
        }
    });

    // Sort categories: prioritize CASH, ADIB, ATM, then alphabetize others
    const categories = ['CASH', 'ADIB', 'ATM'];

    const currentSort = state.sortState[tableId];
    if (currentSort) {
        monthlyData = sortArray([...monthlyData], currentSort.key, currentSort.dir);
    }

    let grandTotalDelivery = 0;
    const grandTotalsBreakdown = {};
    categories.forEach(cat => grandTotalsBreakdown[cat] = 0);

    const rows = monthlyData.map(item => {
        const [year, month] = item.monthYear.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

        const total = item.delivery.total || 0;
        grandTotalDelivery += total;

        const cells = categories.map(cat => {
            const val = item.delivery.breakdown[cat] || 0;
            grandTotalsBreakdown[cat] += val;
            return `<td class="px-6 py-3 text-right">${formatCurrency(val)}</td>`;
        }).join('');

        const totalColorClass = total >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';
        const totalBgClass = 'bg-teal-100/50';

        return `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${monthName} ${year}</td>
            ${cells}
            <td class="px-6 py-3 text-right font-extrabold ${totalColorClass} ${totalBgClass}">${formatCurrency(total)}</td>
        </tr>`;
    }).join('');

    const headerCols = categories.map(cat => {
        const sortKey = `delivery.breakdown.${cat}`;
        return `<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('${sortKey}', '${tableId}', renderMonthlySummary)">
            ${cat} ${getSortIcon(sortKey, tableId)}
        </th>`;
    }).join('');

    return `
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg mb-8 shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${tableId}', renderMonthlySummary)">
                            Month / Year ${getSortIcon('monthYear', tableId)}
                        </th>
                        ${headerCols}
                        <th scope="col" class="px-6 py-3 text-right bg-teal-200/50 sortable-header" onclick="handleSort('delivery.total', '${tableId}', renderMonthlySummary)">
                            Total Delivery Amount ${getSortIcon('delivery.total', tableId)}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Total</th>
                        ${categories.map(cat => `<th scope="col" class="px-6 py-3 font-extrabold text-base text-right">${formatCurrency(grandTotalsBreakdown[cat])}</th>`).join('')}
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-teal-700 bg-teal-200/50">${formatCurrency(grandTotalDelivery)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

function renderMonthlyExpensesTable(monthlyData, shopPrefix) {
    const tableId = `${shopPrefix}_monthly_expenses`;
    const currentSort = state.sortState[tableId];

    if (currentSort) {
        monthlyData = sortArray([...monthlyData], currentSort.key, currentSort.dir);
    }

    let grandTotalExpense = 0;

    const rows = monthlyData.map(item => {
        const [year, month] = item.monthYear.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

        const expense = item.expense || 0;
        grandTotalExpense += expense;

        // For visualization, show expenses as negative amounts (red)
        const displayExpense = -expense;
        const colorClass = 'text-red-700-bold';

        return `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">${monthName} ${year}</td>
            <td class="px-6 py-3 text-right ${colorClass} bg-red-50/50">${formatCurrency(displayExpense)}</td>
        </tr>`;
    }).join('');

    return `
        <div class="overflow-x-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner">
            <table class="w-full text-sm text-left text-gray-500 data-table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${tableId}', renderMonthlySummary)">Month / Year ${getSortIcon('monthYear', tableId)}</th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('expense', '${tableId}', renderMonthlySummary)">Total Expense Amount ${getSortIcon('expense', tableId)}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
                <tfoot class="text-xs text-gray-700 uppercase bg-gray-200 sticky bottom-0">
                    <tr>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base">Grand Total</th>
                        <th scope="col" class="px-6 py-3 font-extrabold text-base text-right text-red-700-bold bg-red-200/50">${formatCurrency(-grandTotalExpense)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}
