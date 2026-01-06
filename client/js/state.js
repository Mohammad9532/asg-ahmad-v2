// --- GLOBAL STATE ---
let allResults = {}; // Cache for all fetched API responses
let activeShop = 'OVERVIEW'; // Default to Overview
let activeDataType = 'bookings';
let dateRange = {};
// We'll initialize dateRange values in main.js or after DOM load
let sortState = {}; // Key: tableId, Value: {key: 'columnName', dir: 'asc'|'desc'}
let searchState = {}; // Key: tableId, Value: query string
