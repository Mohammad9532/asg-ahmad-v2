import { state } from './state.js';
import { SHOP_PREFIXES, ISLAMIC_CYCLES } from './config.js';
import { formatCurrency } from './utils.js';

import { navigateTo } from './router.js';
import { renderContent } from './render.js';
import { renderMonthlySummary } from './render_monthly.js';

// --- UI CORE & NAVIGATION ---

export function showLoading(isLoading) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fetchButton = document.getElementById('fetchButton');
    const statusMessage = document.getElementById('statusMessage');

    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !isLoading);
    if (fetchButton) fetchButton.disabled = isLoading;
    if (statusMessage) statusMessage.classList.toggle('hidden', isLoading);
}

// Side Bar Toggle (Mobile)
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // Toggle Translate
    const isClosed = sidebar.classList.contains('-translate-x-full');

    if (isClosed) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Dark Mode Logic
export function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark');
        updateDarkModeIcon(true);
    }
}

export function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcon(isDark);
}

export function updateDarkModeIcon(isDark) {
    const icon = document.getElementById('darkModeIcon');
    const text = document.getElementById('darkModeText');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

export function renderShopTabs() {
    const container = document.getElementById('sidebarShopList');
    if (!container) return;

    const isAdmin = state.user.role === 'admin';
    const userShop = state.user.shop;

    const getItemClass = (isActive) => isActive
        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-r-4 border-transparent';

    let html = '<div class="space-y-1">';

    if (isAdmin) {
        html += `
            <button onclick="setActiveShop('OVERVIEW')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(state.activeShop === 'OVERVIEW')}">
                🌍 Global Overview
            </button>
            <button onclick="setActiveShop('COMPARE')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(state.activeShop === 'COMPARE')}">
                🎯 Targets & Compare
            </button>
        `;
    }

    html += `
        <button onclick="setActiveShop('CUSTOMERS')"
            class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(state.activeShop === 'CUSTOMERS')}">
            👥 Customers
        </button>
        <div class="my-2 border-t border-slate-100 dark:border-slate-700"></div>
    `;

    const visibleShops = isAdmin
        ? SHOP_PREFIXES
        : SHOP_PREFIXES.filter(s => s.toLowerCase() === (userShop || '').toLowerCase());

    html += visibleShops.map(shop => `
        <button onclick="setActiveShop('${shop}')"
            class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(shop === state.activeShop)}">
            🏪 ${shop}
        </button>
    `).join('');

    html += '</div>';
    container.innerHTML = html;
}

export async function setActiveShop(shop) {
    // 1. Mobile UI Cleanup: close sidebar after selection
    if (window.innerWidth < 1024) { // lg breakpoint
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
        }
    }

    // 2. URL-Based Navigation
    // navigateTo handles state, memory clearing, and rendering
    if (typeof navigateTo === 'function') {
        navigateTo(shop, state.activeDataType);
    }
}

export function renderDataTypeTabs(shopPrefix) {
    const container = document.getElementById('dataTypeTabsContainer');
    if (!container) return;

    // Handle OVERVIEW, COMPARE & CUSTOMERS special cases
    if (shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE' || shopPrefix === 'CUSTOMERS') {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    const tabDefinitions = [
        { type: 'dashboard', label: '📊 Dashboard' },
        { type: 'bookings', label: 'Net Bookings' },
        { type: 'delivery', label: 'Deliveries' },
        { type: 'expense', label: 'Expenses' },
        { type: 'employee', label: '👥 Employees' },
        { type: 'daily_ledger', label: 'Daily Ledger' },
        { type: 'monthly_summary', label: 'Monthly' },
        { type: 'stock_audit', label: '✅ Stock Audit' },
    ];

    container.innerHTML = `<div class="flex flex-nowrap overflow-x-auto tabs-scroll-container pb-4 font-sans">${tabDefinitions.map(tab => `
        <button 
            onclick="setActiveDataType('${tab.type}')"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap border ${tab.type === state.activeDataType
            ? 'text-indigo-600 bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
            : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-2"
        >
            ${tab.label}
        </button>
    `).join('')}</div>`;
}

export function setActiveDataType(dataType) {
    if (typeof navigateTo === 'function') {
        navigateTo(state.activeShop, dataType);
    }
}

// --- DATE & FISCAL YEAR CONTROLS ---

export function setDateRange(rangeType, skipFetch = false) {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    if (rangeType === 'today') {
        // start/end already now
    } else if (rangeType === 'yesterday') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
    } else if (rangeType === 'thisMonth') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
    } else if (rangeType === 'lastMonth') {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (rangeType === 'thisYear') {
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
    }

    document.getElementById('startDate').value = formatDate(start);
    document.getElementById('endDate').value = formatDate(end);

    // Save range type
    localStorage.setItem('selectedRangeType', rangeType);
    localStorage.setItem('startDate', formatDate(start));
    localStorage.setItem('endDate', formatDate(end));

    // Auto fetch if range changed
    if (!skipFetch && typeof window.fetchAllData === 'function') {
        window.fetchAllData();
    }
}

export function initFiscalYearDropdown() {
    const yearSelect = document.getElementById('fiscalYearSelect');
    if (!yearSelect) return;

    yearSelect.innerHTML = '<option value="">-- Select Year --</option>';

    if (typeof ISLAMIC_CYCLES === 'undefined') {
        console.error('ISLAMIC_CYCLES not defined');
        return;
    }

    ISLAMIC_CYCLES.forEach(cycle => {
        const option = document.createElement('option');
        option.value = cycle.id;
        option.textContent = cycle.label;
        yearSelect.appendChild(option);
    });

    // Check localStorage first
    const savedYear = localStorage.getItem('selectedFiscalYear');

    if (savedYear && ISLAMIC_CYCLES.find(c => c.id === savedYear)) {
        yearSelect.value = savedYear;
        updatePeriodOptions();
    } else {
        // Check if there are saved dates first
        const savedStart = localStorage.getItem('startDate');
        const savedEnd = localStorage.getItem('endDate');
        if (savedStart && savedEnd) {
            document.getElementById('startDate').value = savedStart;
            document.getElementById('endDate').value = savedEnd;
            state.dateRange.start = savedStart;
            state.dateRange.end = savedEnd;
        } else {
            // Optional: Auto-select current custom year if found
            const today = new Date().toISOString().split('T')[0];
            const current = ISLAMIC_CYCLES.find(c => today >= c.start && today <= c.end);
            if (current) {
                yearSelect.value = current.id;
                updatePeriodOptions();
            }
        }
    }
}

export function updatePeriodOptions(skipFetch = false) {
    const yearId = document.getElementById('fiscalYearSelect').value;

    // Save selection
    if (yearId) {
        localStorage.setItem('selectedFiscalYear', yearId);
    }

    const periodSelect = document.getElementById('fiscalPeriodSelect');
    periodSelect.innerHTML = '<option value="">-- Select Period --</option>';
    periodSelect.disabled = !yearId;

    if (!yearId) return;

    const cycle = ISLAMIC_CYCLES.find(c => c.id === yearId);
    if (!cycle) return;

    // Calculate split date (Eid)
    // Need to subtract 1 day from Eid for first range end
    const eidDate = new Date(cycle.eid);
    eidDate.setDate(eidDate.getDate() - 1);
    const preEidEnd = eidDate.toISOString().split('T')[0];

    const periods = [
        { id: 'full', label: 'Full Fiscal Year (BE to BE)', start: cycle.start, end: cycle.end },
        { id: 'part1', label: 'Bakra Eid to Eid', start: cycle.start, end: preEidEnd },
        { id: 'part2', label: 'Eid to Bakra Eid', start: cycle.eid, end: cycle.end }
    ];

    periods.forEach(p => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ start: p.start, end: p.end });
        option.textContent = p.label;
        periodSelect.appendChild(option);
    });

    // Default to Full Year
    if (periodSelect.options.length > 1) {
        periodSelect.value = periodSelect.options[1].value;
        applyFiscalPeriod(skipFetch);
    }
}

export function applyFiscalPeriod(skipFetch = false) {
    const periodSelect = document.getElementById('fiscalPeriodSelect');
    const val = periodSelect.value;
    if (!val) return;

    const range = JSON.parse(val);
    document.getElementById('startDate').value = range.start;
    document.getElementById('endDate').value = range.end;

    localStorage.setItem('startDate', range.start);
    localStorage.setItem('endDate', range.end);
    localStorage.setItem('selectedRangeType', 'fiscal');

    // Update global state
    state.dateRange.start = range.start;
    state.dateRange.end = range.end;

    if (!skipFetch && typeof window.fetchAllData === 'function') {
        window.fetchAllData();
    }
}

// --- TABLE CONTROLS ---

export function handleSort(key, tableId) {
    const currentSort = state.sortState[tableId] || { key: 'date', dir: 'desc' };

    if (currentSort.key === key) {
        // Toggle direction
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.dir = 'asc'; // Default new sort to asc
    }

    state.sortState[tableId] = currentSort;

    // Re-render
    if (state.activeDataType === 'monthly_summary') {
        renderMonthlySummary(state.activeShop);
    } else if (state.activeDataType === 'bookings') {
        renderContent(state.activeShop, 'bookings');
    } else if (state.activeDataType === 'delivery') {
        renderContent(state.activeShop, 'delivery');
    } else if (state.activeDataType === 'expense') {
        renderContent(state.activeShop, 'expense');
    } else {
        // Fallback
        renderContent(state.activeShop, state.activeDataType);
    }
}

export function handleTableSearch(tableId, query) {
    state.searchState[tableId] = query;
    // Debounce could be added here, but for now direct update

    // Re-render current view to apply filter
    if (state.activeDataType === 'bookings' || state.activeDataType === 'delivery' || state.activeDataType === 'expense' || state.activeDataType === 'dashboard') {
        renderContent(state.activeShop, state.activeDataType);
    } else {
        // generic
        renderContent(state.activeShop, state.activeDataType);
    }
}

export function renderLegendHTML(methods, total) {
    const colors = { CASH: '#10b981', ADIB: '#6366f1', ATM: '#f59e0b', OTHER: '#94a3b8' };
    const labels = { CASH: 'Cash', ADIB: 'Card/ADIB', ATM: 'ATM', OTHER: 'Other' };

    let html = '<div class="space-y-3">';
    for (const [key, val] of Object.entries(methods)) {
        if (val > 0 || key === 'CASH') {
            const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            html += `
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center">
                        <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${colors[key]}"></span>
                        <span class="text-slate-600 font-medium">${labels[key]}</span>
                    </div>
                    <div class="flex items-center text-slate-700">
                        <span class="font-bold mr-2">${formatCurrency(val)}</span>
                        <span class="text-xs text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">${percent}%</span>
                    </div>
                </div>
            `;
        }
    }
    html += '</div>';
    return html;
}

export function filterEmployeeGrid(query) {
    const cards = document.querySelectorAll('.employee-card');
    const q = (query || '').toLowerCase().trim();
    cards.forEach(card => {
        const name = card.getAttribute('data-name') || '';
        card.classList.toggle('hidden', !name.includes(q));
    });
}
