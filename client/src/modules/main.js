import { state } from './state.js';

import {
    initDarkMode,
    initFiscalYearDropdown,
    setDateRange,
    handleSort,
    handleTableSearch,
    toggleSidebar,
    toggleDarkMode,
    setActiveShop,
    setActiveDataType,
    filterEmployeeGrid,
    updatePeriodOptions,
    applyFiscalPeriod
} from './ui.js';
import { handleRouting, navigateTo } from './router.js';
import { fetchAllData, fetchShopData, logout } from './api.js';
import { handlePageChange } from './render_tables.js';

// Import modules with side effects (window attachments)
import './add_entry.js';
import './stock_audit.js';
import './dailyLedger.js';
import './customers.js';
import './export.js';
import './print.js';
import './compare.js';
import './overview.js';
import './audit.js';
import './aiChat.js';

// Attach global functions used in HTML event handlers
window.handleSort = handleSort;
window.handleTableSearch = handleTableSearch;
window.handlePageChange = handlePageChange;
window.toggleSidebar = toggleSidebar;
window.toggleDarkMode = toggleDarkMode;
window.setActiveShop = setActiveShop;
window.setActiveDataType = setActiveDataType;
window.filterEmployeeGrid = filterEmployeeGrid;
window.fetchAllData = fetchAllData;
window.fetchShopData = fetchShopData;
window.logout = logout;
window.updatePeriodOptions = updatePeriodOptions;
window.applyFiscalPeriod = applyFiscalPeriod;

// Init Application
window.addEventListener('DOMContentLoaded', () => {
    // 1. Init UI Components
    initDarkMode();
    initFiscalYearDropdown();

    // 2. Set Default Date Range (Restores from localStorage if available)
    const savedRange = localStorage.getItem('selectedRangeType') || 'thisMonth';

    // If it's a fiscal or custom period, restore exact dates. Otherwise use preset.
    if (savedRange === 'fiscal' || savedRange === 'custom') {
        const savedStart = localStorage.getItem('startDate');
        const savedEnd = localStorage.getItem('endDate');

        if (savedStart && savedEnd) {
            document.getElementById('startDate').value = savedStart;
            document.getElementById('endDate').value = savedEnd;
            state.dateRange.start = savedStart;
            state.dateRange.end = savedEnd;
            window.fetchAllData();
        } else {
            setDateRange('thisMonth');
        }
    } else {
        setDateRange(savedRange);
    }

    // 3. Handle Initial Routing
    handleRouting();

    // 4. Attach specific listeners that aren't inline
    const fetchBtn = document.getElementById('fetchButton');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', () => fetchAllData());
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
