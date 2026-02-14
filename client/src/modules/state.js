// --- GLOBAL STATE ---
export const state = {
    allResults: {}, // Cache for all fetched API responses
    activeShop: 'OVERVIEW', // Default to Overview
    activeDataType: 'bookings',
    dateRange: {},
    sortState: {}, // Key: tableId, Value: {key: 'columnName', dir: 'asc'|'desc'}
    searchState: {}, // Key: tableId, Value: query string
    pageState: {}, // Key: tableId, Value: currentPage number
};
