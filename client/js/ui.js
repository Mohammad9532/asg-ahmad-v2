// --- UI CORE & NAVIGATION ---

function showLoading(state) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fetchButton = document.getElementById('fetchButton');
    const statusMessage = document.getElementById('statusMessage');

    if (loadingIndicator) loadingIndicator.classList.toggle('hidden', !state);
    if (fetchButton) fetchButton.disabled = state;
    if (statusMessage) statusMessage.classList.toggle('hidden', state);
}

function renderShopTabs() {
    const container = document.getElementById('shopTabsContainer');
    if (!container) return;

    container.innerHTML = `<div class="flex flex-nowrap overflow-x-auto tabs-scroll-container">
        <!-- Overview Tab -->
        <button 
            onclick="setActiveShop('OVERVIEW')"
            class="px-6 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeShop === 'OVERVIEW'
            ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-t-lg"
        >
            🌍 Global Overview
        </button>
        <!-- Compare Tab -->
        <button 
            onclick="setActiveShop('COMPARE')"
            class="px-6 py-3 text-sm font-bold transition-all duration-200 whitespace-nowrap ${activeShop === 'COMPARE'
            ? 'text-teal-700 border-b-2 border-teal-600 bg-teal-50/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-t-lg"
        >
            🎯 Targets & Compare
        </button>
        ${SHOP_PREFIXES.map(shop => `
        <button 
            onclick="setActiveShop('${shop}')"
            class="px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${shop === activeShop
                    ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-t-lg"
        >
            ${shop}
        </button>
    `).join('')}</div>`;
}

function setActiveShop(shop) {
    activeShop = shop;
    renderDataTypeTabs(shop);
    renderContent(shop, activeDataType); // Defined in render.js

    // Update visual state of tabs
    const container = document.getElementById('shopTabsContainer');
    if (container) {
        container.querySelectorAll('button').forEach(btn => {
            // Reset styles
            // Note: This manual class toggling is a bit brittle, re-rendering might be safer but this is faster.
            // Actually, simply calling renderShopTabs() again is cleaner and less error prone.
            // But let's stick to the existing logic or re-render. Re-render is easiest.
        });
        renderShopTabs(); // Re-render to update active state classes
    }
}

function renderDataTypeTabs(shopPrefix) {
    const container = document.getElementById('dataTypeTabsContainer');
    if (!container) return;

    // Handle OVERVIEW & COMPARE special cases
    if (shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE') {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    const tabDefinitions = [
        { type: 'dashboard', label: '📊 Dashboard' },
        { type: 'bookings', label: 'Net Bookings' },
        { type: 'delivery', label: 'Deliveries (Categorized)' },
        { type: 'expense', label: 'Expenses (Categorized)' },
        { type: 'monthly_summary', label: 'Monthly Summary' },
        { type: 'stock_audit', label: '✅ Stock Audit' },
    ];

    container.innerHTML = `<div class="flex flex-nowrap overflow-x-auto tabs-scroll-container p-4 font-sans">${tabDefinitions.map(tab => `
        <button 
            onclick="setActiveDataType('${tab.type}')"
            class="px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${tab.type === activeDataType
            ? 'text-white bg-teal-600 shadow-md transform scale-105'
            : 'text-slate-700 bg-slate-100 hover:bg-slate-200'} focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 mr-2"
        >
            ${tab.label}
        </button>
    `).join('')}</div>`;
}

function setActiveDataType(dataType) {
    activeDataType = dataType;
    renderDataTypeTabs(activeShop); // Re-render tabs to update active state
    renderContent(activeShop, dataType); // Defined in render.js
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
