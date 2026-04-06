import { state } from './state.js';
import { sortArray, formatCurrency, isCanceledStatus, getSortIcon } from './utils.js';

// --- REUSABLE TABLE RENDERERS ---

/**
 * Renders a standard table for any data type (Bookings, Delivery, Expenses).
 */
export function renderStandardTable(shopPrefix, data, dataType, showCanceledIndicator) {

    if (data.filteredData.length === 0) {
        return '<p class="text-center text-gray-500 mt-4">No data found in the selected date range.</p>';
    }

    const tableId = `${shopPrefix}_${dataType}_detailed`;
    let filteredData = [...data.filteredData];

    // Apply sorting
    const currentSort = state.sortState[tableId];

    if (currentSort) {
        filteredData = sortArray(filteredData, currentSort.key, currentSort.dir);
    } else {
        filteredData = sortArray(filteredData, 'date', 'desc'); // Default sort
    }

    // Apply Search Filtering
    const searchQuery = state.searchState[tableId] || '';
    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        filteredData = filteredData.filter(doc => {
            return Object.values(doc).some(val =>
                val && val.toString().toLowerCase().includes(lowerQ)
            );
        });
    }

    // --- PAGINATION LOGIC ---
    const rowsPerPage = 50;
    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const currentPage = state.pageState[tableId] || 1;

    // Slice data for current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    const headerMap = {
        'billNo': 'Bill No',
        'name': 'Customer/Ref',
        'date': 'Date',
        'amountType': 'Type',
        'status': 'Status',
        'amount': 'Amount',
        'cat': 'Category',
        'dept': 'Department',
    };

    // Get all unique keys from data (do not preload headerMap to avoid empty columns)
    let allKeys = new Set();
    filteredData.slice(0, 100).forEach(doc => Object.keys(doc).forEach(key => allKeys.add(key)));

    // Filter out internal MongoDB keys
    const relevantKeys = Array.from(allKeys).filter(key =>
        !['_id', '__v', 'createdAt', 'updatedAt', 'countryCode', 'phone', 'qty', 'modelName'].includes(key)
    );

    // Sort relevantKeys to maintain a logical order (e.g., date, billNo, name, amount...)
    const preferredOrder = Object.keys(headerMap);
    relevantKeys.sort((a, b) => {
        let idxA = preferredOrder.indexOf(a);
        let idxB = preferredOrder.indexOf(b);
        if (idxA === -1) idxA = 999;
        if (idxB === -1) idxB = 999;
        return idxA - idxB;
    });

    // Generate header row with sort handlers
    const headerRow = relevantKeys.map(key => {
        const headerText = headerMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
        return `<th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('${key}', '${tableId}')">
            ${headerText} ${getSortIcon(key, tableId)}
        </th>`;
    }).join('') + `<th scope="col" class="px-6 py-3 text-right">Actions</th>`;

    // Generate data rows for PAGINATED data
    const rows = paginatedData.map(doc => {
        const isCanceled = showCanceledIndicator && isCanceledStatus(doc.status);
        const displayAmount = isCanceled ? -(doc.amount || 0) : (doc.amount || 0);
        const colorClass = isCanceled ? 'text-red-700-bold' : 'text-green-700-bold';

        const cellData = relevantKeys.map(key => {
            let value = doc[key];
            const headerText = headerMap[key] || key.charAt(0).toUpperCase() + key.slice(1);

            if (key === 'date' && value) {
                value = new Date(value).toLocaleDateString();
            } else if (key === 'amount') {
                return `<td class="px-6 py-2 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px] ${colorClass}">
                    <span class="md:hidden font-bold text-slate-500 uppercase text-[10px]">${headerText}</span>
                    <span>${formatCurrency(displayAmount)}</span>
                </td>`;
            } else if (key === 'status') {
                const statusColor = isCanceled ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800';
                value = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${value || 'N/A'}</span>`;
            }

            return `<td class="px-6 py-2.5 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px] font-medium text-slate-700 min-w-0 overflow-hidden">
                <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight mr-4 flex-shrink-0">${headerText}</span>
                <span class="truncate-mobile text-right md:text-left">${value || '-'}</span>
            </td>`;
        }).join('');

        const encodedDoc = encodeURIComponent(JSON.stringify(doc).replace(/'/g, "\\'"));
        const actionHtml = `<td class="px-6 py-4 text-center md:text-right block md:table-cell">
            <button onclick="openEditModal('${encodedDoc}', '${dataType}', '${shopPrefix}')" class="w-full md:w-auto text-indigo-600 hover:text-indigo-900 font-medium text-sm border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg shadow-sm">Edit Entry</button>
        </td>`;

        return `<tr class="bg-white border-b hover:bg-gray-50 transition-colors block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0 relative ${isCanceled ? 'bg-red-50' : ''}">${cellData}${actionHtml}</tr>`;
    }).join('');

    // Generate Pagination Controls
    const paginationHtml = totalPages > 1 ? `
        <div class="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
            <div class="text-xs text-slate-500 font-medium">
                Showing <span class="font-bold text-slate-700 dark:text-slate-300">${startIndex + 1}</span> to <span class="font-bold text-slate-700 dark:text-slate-300">${Math.min(startIndex + rowsPerPage, totalRows)}</span> of <span class="font-bold text-slate-700 dark:text-slate-300">${totalRows}</span>
            </div>
            <div class="flex space-x-2">
                <button onclick="handlePageChange('${tableId}', ${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
                        class="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    Prev
                </button>
                <div class="flex items-center px-2 text-xs font-bold text-slate-600">
                    Page ${currentPage} / ${totalPages}
                </div>
                <button onclick="handlePageChange('${tableId}', ${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}
                        class="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                    Next
                </button>
            </div>
        </div>
    ` : '';

    // Add Search Bar
    const searchHtml = `
        <div class="mb-3 relative max-w-md">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
            </div>
            <input 
                id="${tableId}_search"
                type="text" 
                placeholder="Search bill number, name, amount..." 
                class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                value="${searchQuery.replace(/"/g, '&quot;')}"
                oninput="handleTableSearch('${tableId}', this.value)"
            />
        </div>
    `;

    // Construct the final HTML table
    return `
        ${searchHtml}
        <div class="overflow-hidden border rounded-xl shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
            <div id="${tableId}" class="overflow-y-auto custom-scroll max-h-[600px]">
                <table class="w-full text-sm text-left text-gray-500 data-table block md:table">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700/50 dark:text-slate-300 sticky top-0 z-10 hidden md:table-header-group">
                        <tr>
                            ${headerRow}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700 block md:table-row-group">
                        ${rows}
                    </tbody>
                </table>
            </div>
            ${paginationHtml}
        </div>
    `;
}

export function handlePageChange(tableId, newPage) {
    state.pageState[tableId] = newPage;
    // Re-render the current view
    if (typeof window.renderContent === 'function') {
        window.renderContent(state.activeShop, state.activeDataType);
    }
}

/**
 * Renders the day-wise table for Net Bookings.
 */
export function renderDailyNetBookingTable(dailyData, dataTypeLabel, tableId) {
    if (dailyData.length === 0) {
        return `<p class="text-center text-gray-500 mt-4">No daily ${dataTypeLabel.toLowerCase()} trend data found in the selected date range.</p>`;
    }

    let headerCells = `
        <th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('dateStr', '${tableId}')">Date ${getSortIcon('dateStr', tableId)}</th>
        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('gross', '${tableId}')">Gross Bookings ${getSortIcon('gross', tableId)}</th>
        <th scope="col" class="px-6 py-3 text-right text-red-700-bold sortable-header" onclick="handleSort('canceled', '${tableId}')">Canceled/Deducted ${getSortIcon('canceled', tableId)}</th>
        <th scope="col" class="px-6 py-3 text-right bg-green-100/50 text-green-700-bold sortable-header" onclick="handleSort('net', '${tableId}')">Net Booking Total ${getSortIcon('net', tableId)}</th>
        <th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('count', '${tableId}')">Count ${getSortIcon('count', tableId)}</th>
    `;
    let rowCells = '';

    dailyData.forEach(item => {
        let grossAmount = item.gross || 0;
        let canceledAmount = item.canceled || 0;
        let netAmount = item.net || 0;

        let netColorClass = netAmount >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';
        let grossColorClass = grossAmount >= 0 ? 'text-teal-700' : 'text-red-700-bold';

        rowCells += `<tr class="bg-white border-b hover:bg-gray-50 block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0 relative">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Date</span> ${item.dateStr}
            </td>
            <td class="px-6 py-3 text-right ${grossColorClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Gross Bookings</span> ${formatCurrency(grossAmount)}
            </td>
            <td class="px-6 py-3 text-right text-red-700-bold block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Canceled</span> ${formatCurrency(canceledAmount)}
            </td>
            <td class="px-6 py-3 text-right ${netColorClass} bg-green-100/50 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-green-700 uppercase text-xs">Net Booking</span> ${formatCurrency(netAmount)}
            </td>
            <td class="px-6 py-3 text-right text-gray-700 block md:table-cell md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Count</span> ${item.count}
            </td>
        </tr>`;
    });

    return `
        <div class="overflow-y-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner bg-white">
            <table class="w-full text-sm text-left text-gray-500 data-table block md:table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 hidden md:table-header-group">
                    <tr>
                        ${headerCells}
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    ${rowCells}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renders the day-wise multi-category table for Deliveries and Expenses.
 */
export function renderDailyCategoryTrendTable(dailyAggregates, allCategories, dataTypeLabel, tableId) {
    if (dailyAggregates.length === 0) {
        return `<p class="text-center text-gray-500 mt-4">No daily ${dataTypeLabel.toLowerCase()} trend data found in the selected date range.</p>`;
    }

    const isExpense = dataTypeLabel === 'Expenses';

    // --- 1. Build Headers ---
    let headerCells = `<th scope="col" class="px-6 py-3 sortable-header" onclick="handleSort('dateStr', '${tableId}')">Date ${getSortIcon('dateStr', tableId)}</th>`;

    const totalLabel = isExpense ? 'Total Expense' : 'Grand Total';
    const totalBgClass = isExpense ? 'bg-red-100/50' : 'bg-teal-100/50';
    const totalSortKey = 'total';

    // 1a. Expense: Total column first
    if (isExpense) {
        headerCells += `<th scope="col" class="px-6 py-3 text-right font-bold ${totalBgClass} sortable-header" onclick="handleSort('${totalSortKey}', '${tableId}')">${totalLabel} ${getSortIcon(totalSortKey, tableId)}</th>`;
    }

    // 1b. Category columns
    allCategories.forEach(cat => {
        headerCells += `<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('breakdown.${cat}', '${tableId}')">${cat.charAt(0).toUpperCase() + cat.slice(1)} ${getSortIcon(`breakdown.${cat}`, tableId)}</th>`;
    });

    // 1c. Deliveries: Total column last
    if (!isExpense) {
        headerCells += `<th scope="col" class="px-6 py-3 text-right font-bold ${totalBgClass} sortable-header" onclick="handleSort('${totalSortKey}', '${tableId}')">${totalLabel} ${getSortIcon(totalSortKey, tableId)}</th>`;
    }

    headerCells += `<th scope="col" class="px-6 py-3 text-right sortable-header" onclick="handleSort('count', '${tableId}')">Count ${getSortIcon('count', tableId)}</th>`;

    // --- 2. Build Rows ---
    let rowCells = '';
    dailyAggregates.forEach(item => {
        const daily = item;
        let row = `<tr class="bg-white border-b hover:bg-gray-50 block md:table-row border-b-4 border-slate-100 md:border-none mb-4 md:mb-0 relative py-2">
            <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-slate-50/50 md:bg-transparent">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Date</span> ${daily.dateStr}
            </td>`;

        // Calculate Total for row
        let totalAmount = daily.total || 0;
        if (isExpense) totalAmount = -totalAmount; // Total is negative for visual expense report
        const totalColorClass = totalAmount >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';

        // 2a. Expense: Total cell first
        if (isExpense) {
            row += `<td class="px-6 py-3 text-right font-extrabold ${totalColorClass} ${totalBgClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">${totalLabel}</span> ${formatCurrency(totalAmount)}
            </td>`;
        }

        // 2b. Category Cells
        allCategories.forEach(cat => {
            let amount = daily.breakdown[cat] || 0;
            const displayAmount = isExpense ? -amount : amount;

            const colorClass = displayAmount >= 0 ? 'text-green-700-bold' : 'text-red-700-bold';
            row += `<td class="px-6 py-3 text-right ${colorClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">${cat}</span> ${formatCurrency(displayAmount)}
            </td>`;
        });

        // 2c. Deliveries: Total cell last
        if (!isExpense) {
            row += `<td class="px-6 py-3 text-right font-extrabold ${totalColorClass} ${totalBgClass} block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                <span class="md:hidden font-bold text-slate-500 uppercase text-xs">${totalLabel}</span> ${formatCurrency(totalAmount)}
            </td>`;
        }

        row += `<td class="px-6 py-3 text-right text-gray-700 block md:table-cell md:border-none flex justify-between items-center md:block">
            <span class="md:hidden font-bold text-slate-500 uppercase text-xs">Count</span> ${daily.count}
        </td></tr>`;

        rowCells += row;
    });

    // --- 3. Construct Table ---
    return `
        <div id="${tableId}" class="overflow-y-auto custom-scroll max-h-[500px] border rounded-lg shadow-inner bg-white">
            <table class="w-full text-sm text-left text-gray-500 data-table block md:table">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 hidden md:table-header-group">
                    <tr>
                        ${headerCells}
                    </tr>
                </thead>
                <tbody class="block md:table-row-group">
                    ${rowCells}
                </tbody>
            </table>
        </div>
    `;
}
