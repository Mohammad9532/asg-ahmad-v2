// --- GLOBAL STATE ---
export const state = {
    user: {
        username: localStorage.getItem('username') || null,
        role: localStorage.getItem('userRole') || 'admin', // Default to admin for safety with existing sessions
        shop: localStorage.getItem('userShop') || null
    },
    allResults: {},
    activeShop: 'OVERVIEW',
    activeDataType: 'bookings',
    dateRange: {},
    sortState: {},
    searchState: {},
    pageState: {},
};
