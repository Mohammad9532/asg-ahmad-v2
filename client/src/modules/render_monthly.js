import { state } from './state.js';
import { formatCurrency, isCanceledStatus, sortArray, getSortIcon } from './utils.js';


/**
 * Aggregates data by month across all data types.
 */
function aggregateMonthlyData(shopPrefix) {
    const allBookings = state.allResults[`${shopPrefix}|bookings`]?.filteredData || [];
    const allDeliveries = state.allResults[`${shopPrefix}|delivery`]?.filteredData || [];
    const allExpenses = state.allResults[`${shopPrefix}|expense`]?.filteredData || [];

    const monthlyData = {};

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

    allDeliveries.forEach(doc => {
        const date = new Date(doc.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = doc.amount || 0;

        const bNo = (doc.billNo || '').toLowerCase().trim();
        let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

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

    container.innerHTML = `
        <div class="flex justify-end mb-4">
            <button 
                onclick="exportMonthlySummaryToCSV('${shopPrefix}')" 
                class="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-150 shadow-lg"
            >
                Export Monthly Report to CSV (Excel Format)
            </button>
        </div>
        ${renderUnifiedMonthlyTable(monthlyData, shopPrefix)}
    `;
}

function renderUnifiedMonthlyTable(monthlyData, shopPrefix) {
    const tableId = `${shopPrefix}_monthly_unified`;
    const currentSort = state.sortState[tableId];

    if (currentSort) {
        monthlyData = sortArray([...monthlyData], currentSort.key, currentSort.dir);
    }

    let grandTotalNet = 0;
    let grandTotalDelivery = 0;
    let grandTotalExpense = 0;

    const rows = monthlyData.map(item => {
        const [year, month] = item.monthYear.split('-').map(Number);
        const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

        const net = item.net || 0;
        const delivery = item.delivery.total || 0;
        const expense = item.expense || 0;

        grandTotalNet += net;
        grandTotalDelivery += delivery;
        grandTotalExpense += expense;

        const netColorClass = net >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';
        const deliveryColorClass = 'text-teal-700 font-bold';
        const expenseColorClass = 'text-red-600 font-bold';

        return `<tr class="bg-white border-b hover:bg-gray-50 block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0">
            <td class="px-6 py-2.5 font-bold text-slate-900 whitespace-nowrap block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-slate-50/50 md:bg-transparent text-[13px]">
                <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Month / Year</span>
                <span>${monthName} ${year}</span>
            </td>
            <td class="px-6 py-2.5 text-right ${netColorClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px]">
                <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Net Booking</span>
                <span>${formatCurrency(net)}</span>
            </td>
            <td class="px-6 py-2.5 text-right ${deliveryColorClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px]">
                <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Total Delivery</span>
                <span>${formatCurrency(delivery)}</span>
            </td>
            <td class="px-6 py-2.5 text-right ${expenseColorClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px]">
                <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Total Expense</span>
                <span>${formatCurrency(-expense)}</span>
            </td>
            <td class="px-6 py-2 text-center block md:table-cell md:border-none uppercase">
                <div class="flex justify-between items-center md:justify-center">
                    <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Export</span>
                    <button onclick="viewMonthlyDetail('${shopPrefix}', '${item.monthYear}')" class="text-indigo-600 hover:text-indigo-800 transition-colors mr-3" title="View Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button onclick="downloadMonthlyExcel('${shopPrefix}', '${item.monthYear}')" class="text-green-600 hover:text-green-800 transition-colors" title="Download Excel">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    return `
    <div id="${tableId}_container" class="space-y-6">
        <div class="border rounded-lg shadow-inner overflow-hidden">
            <table class="w-full text-left text-slate-600 data-table block md:table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 hidden md:table-header-group">
                    <tr>
                        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('monthYear', '${tableId}', renderMonthlySummary)">
                            Month / Year ${getSortIcon('monthYear', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('net', '${tableId}', renderMonthlySummary)">
                            Net Booking ${getSortIcon('net', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('delivery.total', '${tableId}', renderMonthlySummary)">
                            Total Delivery ${getSortIcon('delivery.total', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('expense', '${tableId}', renderMonthlySummary)">
                            Total Expense ${getSortIcon('expense', tableId)}
                        </th>
                        <th scope="col" class="px-6 py-3 text-center">Export</th>
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    ${rows}
                </tbody>
                <tfoot class="text-[10px] text-gray-700 uppercase bg-gray-200 sticky bottom-0 block md:table-footer-group">
                    <tr class="block md:table-row">
                        <th scope="col" class="px-6 py-3 font-black text-sm block md:table-cell border-b border-slate-300 md:border-none bg-gray-200">Grand Totals</th>
                        <th scope="col" class="px-6 py-2.5 font-black text-sm text-right text-green-700 block md:table-cell border-b border-slate-300 md:border-none flex justify-between items-center md:block">
                            <span class="md:hidden font-bold text-slate-600 uppercase text-[10px]">Total Net Booking</span> ${formatCurrency(grandTotalNet)}
                        </th>
                        <th scope="col" class="px-6 py-2.5 font-black text-sm text-right text-teal-700 block md:table-cell border-b border-slate-300 md:border-none flex justify-between items-center md:block">
                            <span class="md:hidden font-bold text-slate-600 uppercase text-[10px]">Total Delivery</span> ${formatCurrency(grandTotalDelivery)}
                        </th>
                        <th scope="col" class="px-6 py-2.5 font-black text-sm text-right text-red-700 block md:table-cell border-b border-slate-300 md:border-none flex justify-between items-center md:block">
                            <span class="md:hidden font-bold text-slate-600 uppercase text-[10px]">Total Expense</span> ${formatCurrency(-grandTotalExpense)}
                        </th>
                        <th scope="col" class="px-6 py-2 block md:table-cell"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
`;
}
export function viewMonthlyDetail(shop, monthYear) {
    const [year, month] = monthYear.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    if (window.setCustomDateRange) {
        window.setCustomDateRange(startDate, endDate, true);
    }

    if (typeof window.setActiveShop === 'function') {
        window.setActiveShop(shop);
    }

    // Switch to bookings tab on the dashboard
    if (typeof window.setActiveDataType === 'function') {
        window.setActiveDataType('bookings');
    }

    // Trigger full fetch for the new range
    if (typeof window.fetchAllData === 'function') {
        window.fetchAllData();
    }
}

window.viewMonthlyDetail = viewMonthlyDetail;
