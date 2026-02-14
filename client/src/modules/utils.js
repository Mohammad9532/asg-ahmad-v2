import { state } from './state.js';

export function formatCurrency(amount) {
    const num = Number(amount);
    if (isNaN(num)) return 'AED 0.00';
    const sign = num < 0 ? '-' : '';
    return `${sign} AED ${Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Generic data sorting function.
 */
export function sortArray(data, key, direction) {
    const numericKeys = ['totalAmount', 'gross', 'cancelAmount', 'netAmount', 'delivery', 'expense', 'CASH', 'ADIB', 'ATM', 'count', 'total', 'amount'];

    data.sort((a, b) => {
        let aVal = a[key] || 0;
        let bVal = b[key] || 0;

        // Handle nested objects for monthly summary breakdown keys
        if (key.includes('.')) {
            const [objKey, nestedKey] = key.split('.');
            aVal = a[objKey] ? a[objKey][nestedKey] || 0 : 0;
            bVal = b[objKey] ? b[objKey][nestedKey] || 0 : 0;
        }

        // Special handling for date strings (YYYY-MM or YYYY-MM-DD)
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('monthyear')) {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else if (numericKeys.includes(key)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        } else {
            // String comparison
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    return data;
}

/**
 * Gets the sort icon HTML based on the current state.
 */
export function getSortIcon(key, tableId) {
    // sortState is defined in state.js
    const currentSort = state.sortState ? state.sortState[tableId] : null;
    if (!currentSort || currentSort.key !== key) {
        // Default: show neutral up/down arrow icon
        return `<span class="sort-icon text-gray-400">▲▼</span>`;
    }
    const icon = currentSort.dir === 'asc' ? '▲' : '▼';
    return `<span class="sort-icon text-teal-600">${icon}</span>`;
}

/**
 * Helper to check if a status string represents a canceled/deducted record.
 */
export function isCanceledStatus(status) {
    if (status === null || status === undefined) return false;
    const s = String(status).toLowerCase().trim();
    return s === 'cancel' || s === 'canceled' || s === 'cancelled' || s === 'deducted';
}

/**
 * Calculates the total sum of amount for all canceled/deducted documents in an array.
 */
export function calculateCanceledSum(dataArray) {
    if (!Array.isArray(dataArray)) return 0;
    return dataArray
        .filter(doc => isCanceledStatus(doc.status))
        .reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);
}

/**
 * Calculates the total amount of canceled items bookings data.
 */
export function getTotalCanceledAmount(shopPrefix) {
    // allResults defined in state.js
    const bookingsData = state.allResults[`${shopPrefix}|bookings`];
    let totalCanceled = 0;

    if (bookingsData?.filteredData) {
        totalCanceled = calculateCanceledSum(bookingsData.filteredData);
    }
    return totalCanceled;
}

/**
 * Calculates the total amount for the Gross Bookings.
 */
export function getTotalBookingsAmount(shopPrefix) {
    const bookingsData = state.allResults[`${shopPrefix}|bookings`];
    let totalBookings = 0;

    if (bookingsData?.filteredData) {
        // Calculate Gross Bookings (including canceled items)
        totalBookings = bookingsData.filteredData.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    }
    return totalBookings;
}
