// --- UI CORE & NAVIGATION ---

function showLoading(state) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fetchButton = document.getElementById('fetchButton');
    const statusMessage = document.getElementById('statusMessage');

    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !state);
    if (fetchButton) fetchButton.disabled = state;
    if (statusMessage) statusMessage.classList.toggle('hidden', state);
}

// Side Bar Toggle (Mobile)
function toggleSidebar() {
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
function initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark');
        updateDarkModeIcon(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcon(isDark);
}

function updateDarkModeIcon(isDark) {
    const icon = document.getElementById('darkModeIcon');
    const text = document.getElementById('darkModeText');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (text) text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function renderShopTabs() {
    // Note: We now target the Sidebar List
    const container = document.getElementById('sidebarShopList');
    if (!container) return;

    // Helper for active class
    const getItemClass = (isActive) => isActive
        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-r-4 border-indigo-600 dark:border-indigo-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-r-4 border-transparent';

    container.innerHTML = `
        <div class="space-y-1">
            <button onclick="setActiveShop('OVERVIEW')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(activeShop === 'OVERVIEW')}">
                🌍 Global Overview
            </button>
            <button onclick="setActiveShop('COMPARE')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(activeShop === 'COMPARE')}">
                🎯 Targets & Compare
            </button>
            <button onclick="setActiveShop('CUSTOMERS')"
                class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(activeShop === 'CUSTOMERS')}">
                👥 Customers
            </button>
            
            <div class="my-2 border-t border-slate-100 dark:border-slate-700"></div>
            
            ${SHOP_PREFIXES.map(shop => `
                <button onclick="setActiveShop('${shop}')"
                    class="w-full text-left px-4 py-3 text-sm font-medium transition-colors ${getItemClass(shop === activeShop)}">
                    🏪 ${shop}
                </button>
            `).join('')}
        </div>
    `;
}

async function setActiveShop(shop) {
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
        navigateTo(shop, activeDataType);
    }
}

function renderDataTypeTabs(shopPrefix) {
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
        { type: 'employees', label: '👥 Employees' },
        { type: 'daily_ledger', label: 'Daily Ledger' },
        { type: 'monthly_summary', label: 'Monthly' },
        { type: 'stock_audit', label: '✅ Stock Audit' },
    ];

    container.innerHTML = `<div class="flex flex-nowrap overflow-x-auto tabs-scroll-container pb-4 font-sans">${tabDefinitions.map(tab => `
        <button 
            onclick="setActiveDataType('${tab.type}')"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap border ${tab.type === activeDataType
            ? 'text-indigo-600 bg-indigo-50 border-indigo-200 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
            : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-2"
        >
            ${tab.label}
        </button>
    `).join('')}</div>`;
}

function setActiveDataType(dataType) {
    if (typeof navigateTo === 'function') {
        navigateTo(activeShop, dataType);
    }
}

// --- DATE & FISCAL YEAR CONTROLS ---

function setDateRange(rangeType) {
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

    // Auto fetch if range changed
    fetchAllData();
}

function initFiscalYearDropdown() {
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
        // Optional: Auto-select current custom year if found
        // Logic: if today is within a cycle's start/end
        const today = new Date().toISOString().split('T')[0];
        const current = ISLAMIC_CYCLES.find(c => today >= c.start && today <= c.end);
        if (current) {
            yearSelect.value = current.id;
            updatePeriodOptions();
        }
    }
}

function updatePeriodOptions() {
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
        applyFiscalPeriod();
    }
}

function applyFiscalPeriod() {
    const periodSelect = document.getElementById('fiscalPeriodSelect');
    const val = periodSelect.value;
    if (!val) return;

    const range = JSON.parse(val);
    document.getElementById('startDate').value = range.start;
    document.getElementById('endDate').value = range.end;

    // Update global state
    dateRange.start = range.start;
    dateRange.end = range.end;

    fetchAllData();
}

// --- TABLE CONTROLS ---

function handleSort(key, tableId, renderContentFn) {
    const currentSort = sortState[tableId] || { key: 'date', dir: 'desc' };

    if (currentSort.key === key) {
        // Toggle direction
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.key = key;
        currentSort.dir = 'asc'; // Default new sort to asc
    }

    sortState[tableId] = currentSort;

    // Re-render
    // renderContentFn is passed as a reference to the specific render function
    // Usage: onclick="handleSort('field', 'id', renderThisData)"
    // Note: In HTML onclick attributes, functions must be global. 
    // If renderContentFn is passed as a function reference it won't work from string.
    // It should be passed as a string name or we handle it in the switch.

    // Correction: In proper refactoring, we should just call renderContent based on active state.
    // Specifying renderContentFn in HTML is tricky if it's not a global string.
    // Let's rely on activeShop and activeDataType to re-render the right thing.

    if (activeDataType === 'monthly_summary') {
        renderMonthlySummary(activeShop);
    } else if (activeDataType === 'bookings') {
        renderContent(activeShop, 'bookings');
    } else if (activeDataType === 'delivery') {
        renderContent(activeShop, 'delivery');
    } else if (activeDataType === 'expense') {
        renderContent(activeShop, 'expense');
    } else {
        // Fallback
        renderContent(activeShop, activeDataType);
    }
}

function handleTableSearch(tableId, query) {
    searchState[tableId] = query;
    // Debounce could be added here, but for now direct update

    // Re-render current view to apply filter
    if (activeDataType === 'bookings' || activeDataType === 'delivery' || activeDataType === 'expense' || activeDataType === 'dashboard') {
        renderContent(activeShop, activeDataType);
    } else {
        // generic
        renderContent(activeShop, activeDataType);
    }
}

function renderLegendHTML(methods, total) {
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

function filterEmployeeGrid(query) {
    const cards = document.querySelectorAll('.employee-card');
    const q = (query || '').toLowerCase().trim();
    cards.forEach(card => {
        const name = card.getAttribute('data-name') || '';
        card.classList.toggle('hidden', !name.includes(q));
    });
}
