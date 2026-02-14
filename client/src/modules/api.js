import { state } from './state.js';
import { BASE_URL } from './config.js';
import { showLoading, renderShopTabs, renderDataTypeTabs } from './ui.js';
import { renderContent } from './render.js';

// --- FETCHING LOGIC ---

function logError(message) {
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.classList.remove('hidden');
        errorLog.innerHTML = `<p class="font-bold">API Error! One or more API requests failed.</p><p>Error: ${message}</p>`;
    }
    console.error(message);
}

export const logout = () => {
    // Basic logout implementation until properly imported likely from main or auth module
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
};


/**
 * Creates a new entry manually.
 */
export async function createEntry(shop, type, data) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const apiType = type.toLowerCase();

    try {
        const response = await fetch(`${BASE_URL}/api/${shop}/${apiType}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create entry');
        }

        return await response.json();
    } catch (error) {
        console.error('Create Entry Error:', error);
        throw error;
    }
}

export async function fetchEndpoint(shopPrefix, dataType, start, end) {
    const routePath = `/api/${shopPrefix}/${dataType}/summary?start=${start}&end=${end}`;
    const url = BASE_URL + routePath;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout(); // Token expired or invalid
            return;
        }

        if (!response.ok) {
            throw new Error(`[${shopPrefix}|${dataType}] Failed with status ${response.status}`);
        }

        const data = await response.json();
        state.allResults[`${shopPrefix}|${dataType}`] = data;

    } catch (error) {
        logError(`[${shopPrefix}|${dataType}] ${error.message}`);
        state.allResults[`${shopPrefix}|${dataType}`] = {
            totalAmount: 0,
            filteredData: [],
            isError: true,
            errorMessage: error.message
        };
    }
}

/**
 * Fetches high-level summary for ALL shops in one request.
 */
export async function fetchGlobalSummary(start, end) {
    const url = `${BASE_URL}/api/global/summary?start=${start}&end=${end}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch global summary");
        }

        const summaryData = await response.json();

        // Populate allResults with summary data
        Object.keys(summaryData).forEach(shop => {
            const metrics = summaryData[shop];
            state.allResults[`${shop}|SUMMARY|bookings`] = metrics.bookings;
            state.allResults[`${shop}|SUMMARY|delivery`] = metrics.delivery;
            state.allResults[`${shop}|SUMMARY|expense`] = metrics.expense;
            state.allResults[`${shop}|SUMMARY|accrual_delivery`] = metrics.accrual_delivery;
            state.allResults[`${shop}|SUMMARY|lifetime`] = metrics.lifetime;
        });

        state.allResults['GLOBAL|LOADED'] = true;

    } catch (error) {
        console.error("Global Summary Error:", error);
        const displayError = error.message.includes("Failed to fetch")
            ? "Global Summary Error: The server could not process the request. Some charts may be empty."
            : error.message;
        logError(displayError);
    }
}

/**
 * Fetches detailed data for a specific shop.
 */
export async function fetchShopData(shopPrefix) {
    if (shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE' || shopPrefix === 'CUSTOMERS') return;

    showLoading(true);
    const fetchPromises = [
        fetchEndpoint(shopPrefix, 'bookings', state.dateRange.start, state.dateRange.end),
        fetchEndpoint(shopPrefix, 'delivery', state.dateRange.start, state.dateRange.end),
        fetchEndpoint(shopPrefix, 'expense', state.dateRange.start, state.dateRange.end),
        fetchEndpoint(shopPrefix, 'employee', state.dateRange.start, state.dateRange.end),
        fetchEndpoint(shopPrefix, 'accrual_delivery', state.dateRange.start, state.dateRange.end),
        fetchEndpoint(shopPrefix, 'lifetime', state.dateRange.start, state.dateRange.end)
    ];
    await Promise.all(fetchPromises);
    showLoading(false);

    // Mark as fully loaded
    state.allResults[`${shopPrefix}|FULL_LOADED`] = true;

    renderContent(state.activeShop, state.activeDataType);
}

/**
 * Fetches detailed history for a specific employee.
 */
export async function fetchEmployeeHistory(shop, name) {
    const url = `${BASE_URL}/api/${shop}/employee/history?name=${encodeURIComponent(name)}&start=${state.dateRange.start}&end=${state.dateRange.end}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
}

export async function fetchAllData() {
    // 1. Sync Date Range from UI
    state.dateRange.start = document.getElementById('startDate').value;
    state.dateRange.end = document.getElementById('endDate').value;

    // Persist manual changes
    localStorage.setItem('startDate', state.dateRange.start);
    localStorage.setItem('endDate', state.dateRange.end);
    // If not currently a known preset or fiscal, mark as custom
    const currentRange = localStorage.getItem('selectedRangeType');
    const presets = ['today', 'yesterday', 'thisMonth', 'lastMonth', 'thisYear', 'fiscal'];
    if (!presets.includes(currentRange)) {
        localStorage.setItem('selectedRangeType', 'custom');
    }

    // 2. State Reset (Makes it feel like a "new page")
    state.allResults = {};
    state.sortState = {};
    state.searchState = {};
    state.pageState = {}; // Reset pagination on refresh

    document.getElementById('errorLog').classList.add('hidden');
    showLoading(true);

    try {
        // 3. Selective Fetching (Optimization)
        if (state.activeShop === 'OVERVIEW' || state.activeShop === 'COMPARE') {
            // Global overview needs metrics for all shops
            await fetchGlobalSummary(state.dateRange.start, state.dateRange.end);
        } else if (state.activeShop === 'CUSTOMERS') {
            // Customer view needs detailed records from all shops to aggregate
            const { SHOP_PREFIXES } = await import('./config.js');
            const fetchPromises = SHOP_PREFIXES.map(shop =>
                fetchEndpoint(shop, 'bookings', state.dateRange.start, state.dateRange.end)
            );
            await Promise.all(fetchPromises);
        } else {
            // ACTIVE SHOP VIEW: Skip 44 other shops!
            await fetchShopData(state.activeShop);
        }

        // 4. Update UI
        const now = new Date();
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) lastUpdated.textContent = now.toLocaleTimeString();

        renderShopTabs();
        renderDataTypeTabs(state.activeShop);
        renderContent(state.activeShop, state.activeDataType);

    } catch (err) {
        logError("Fetch Operation Failed: " + err.message);
    } finally {
        showLoading(false);
    }
}
