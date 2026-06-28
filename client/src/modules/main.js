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
import { fetchAllData, fetchShopData, logout, openGlobalProfitModal } from './api.js';
import { handlePageChange } from './render_tables.js';

// Import modules with side effects (window attachments)
import { handleDeliveryBillNoInput } from './add_entry.js';
import './stock_audit.js';
import './dailyLedger.js';
import './customers.js';
import './export.js';
import './print.js';
import './compare.js';
import './overview.js';
import './audit.js';
import './aiChat.js';
import { openEditModal, closeEditModal, handleEditSubmit } from './edit_entry.js';
import { renderContent } from './render.js';
import './master_data.js';

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
window.openGlobalProfitModal = openGlobalProfitModal;
window.logout = logout;
window.updatePeriodOptions = updatePeriodOptions;
window.applyFiscalPeriod = applyFiscalPeriod;
window.setDateRange = setDateRange;
window.handleDeliveryBillNoInput = handleDeliveryBillNoInput;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.handleEditSubmit = handleEditSubmit;
window.renderContent = renderContent;

// Init Application
window.addEventListener('DOMContentLoaded', async () => {
    // 0. Auth Guard: Immediately check if token exists
    const token = localStorage.getItem('authToken');
    const isValidToken = token && token !== 'undefined' && token !== 'null';
    if (!isValidToken) {
        window.location.replace('login.html');
        return;
    }

    // 1. Init UI Components
    initDarkMode();
    initFiscalYearDropdown();

    // 2. Set Default Date Range (Restores from localStorage if available)
    const savedRange = localStorage.getItem('selectedRangeType') || 'thisMonth';

    // If it's a fiscal or custom period, restore exact dates. Otherwise use preset.
    // We pass true for skipFetch to prevent redundant network calls during initial load
    if (savedRange === 'fiscal' || savedRange === 'custom') {
        const savedStart = localStorage.getItem('startDate');
        const savedEnd = localStorage.getItem('endDate');

        if (savedStart && savedEnd) {
            document.getElementById('startDate').value = savedStart;
            document.getElementById('endDate').value = savedEnd;
            state.dateRange.start = savedStart;
            state.dateRange.end = savedEnd;
        } else {
            setDateRange('thisMonth', true);
        }
    } else {
        setDateRange(savedRange, true);
    }

    // 3. Handle Initial Routing (This will trigger the initial fetchAllData)
    await handleRouting();

    // 4. Attach specific listeners that aren't inline
    const fetchBtn = document.getElementById('fetchButton');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', () => fetchAllData());
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 5. Role-Based UI Cleanup
    cleanupUIForRole();
});

function cleanupUIForRole() {
    const isAdmin = state.user && state.user.role === 'admin';
    if (isAdmin) return;

    console.log("[AUTH] Trimming UI for Shop Role...");

    // List of elements to hide for shop workers
    const adminOnlyElements = [
        'aiChatModal',
        'aiChatTrigger', // If exists
        'scanMissingBtn',
        'downloadAllBtn',
        'openMissingBillsModalBtn' // Custom ID check
    ];

    adminOnlyElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Handle "Analyze Health" button specifically (no ID in HTML, let's find it by text)
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Analyze Health') || btn.textContent.includes('Find Missing Bills')) {
            btn.remove();
        }
    });

    // Also hide the floating AI Trigger if any (None found in HTML but safe to logic out)
}
