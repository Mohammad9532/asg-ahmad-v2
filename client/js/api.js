// --- FETCHING LOGIC ---

function logError(message) {
    const errorLog = document.getElementById('errorLog');
    if (errorLog) {
        errorLog.classList.remove('hidden');
        errorLog.innerHTML = `< p class="font-bold" > API Error! One or more API requests failed.</p > <p>Error: ${message}</p>`;
    }
    console.error(message);
}

/**
 * Creates a new entry manually.
 */
async function createEntry(shop, type, data) {
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

async function fetchEndpoint(shopPrefix, dataType, start, end) {
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
        allResults[`${shopPrefix}|${dataType}`] = data;

    } catch (error) {
        logError(`[${shopPrefix}|${dataType}] ${error.message}`);
        allResults[`${shopPrefix}|${dataType}`] = {
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
async function fetchGlobalSummary(start, end) {
    const url = `${BASE_URL}/api/global/summary?start=${start}&end=${end}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch global summary");
        }

        const summaryData = await response.json();

        // Populate allResults with summary data
        Object.keys(summaryData).forEach(shop => {
            const metrics = summaryData[shop];
            allResults[`${shop}|bookings`] = metrics.bookings;
            allResults[`${shop}|delivery`] = metrics.delivery;
            allResults[`${shop}|expense`] = metrics.expense;
            allResults[`${shop}|accrual_delivery`] = metrics.accrual_delivery;
            allResults[`${shop}|lifetime`] = metrics.lifetime;
        });

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
async function fetchShopData(shopPrefix) {
    if (shopPrefix === 'OVERVIEW' || shopPrefix === 'COMPARE' || shopPrefix === 'CUSTOMERS') return;

    showLoading(true);
    const fetchPromises = [
        fetchEndpoint(shopPrefix, 'bookings', dateRange.start, dateRange.end),
        fetchEndpoint(shopPrefix, 'delivery', dateRange.start, dateRange.end),
        fetchEndpoint(shopPrefix, 'expense', dateRange.start, dateRange.end),
        fetchEndpoint(shopPrefix, 'employee', dateRange.start, dateRange.end),
        fetchEndpoint(shopPrefix, 'accrual_delivery', dateRange.start, dateRange.end),
        fetchEndpoint(shopPrefix, 'lifetime', dateRange.start, dateRange.end)
    ];
    await Promise.all(fetchPromises);
    showLoading(false);

    // Mark as fully loaded
    allResults[`${shopPrefix}|FULL_LOADED`] = true;

    renderContent(activeShop, activeDataType);
}

async function fetchAllData() {
    // 1. Sync Date Range from UI
    dateRange.start = document.getElementById('startDate').value;
    dateRange.end = document.getElementById('endDate').value;

    // 2. State Reset (Makes it feel like a "new page")
    allResults = {};
    sortState = {};
    searchState = {};
    pageState = {}; // Reset pagination on refresh

    document.getElementById('errorLog').classList.add('hidden');
    showLoading(true);

    try {
        // 3. Selective Fetching (Optimization)
        if (activeShop === 'OVERVIEW' || activeShop === 'COMPARE') {
            // Global overview needs metrics for all shops
            await fetchGlobalSummary(dateRange.start, dateRange.end);
        } else if (activeShop === 'CUSTOMERS') {
            // Customer view needs detailed data for current period
            // Currently it fetches everything via fetchGlobalSummary?
            // Let's stick to global summary for now as it's small for just totals
            await fetchGlobalSummary(dateRange.start, dateRange.end);
        } else {
            // ACTIVE SHOP VIEW: Skip 44 other shops!
            await fetchShopData(activeShop);
        }

        // 4. Update UI
        const now = new Date();
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) lastUpdated.textContent = now.toLocaleTimeString();

        renderShopTabs();
        renderDataTypeTabs(activeShop);
        renderContent(activeShop, activeDataType);

    } catch (err) {
        logError("Fetch Operation Failed: " + err.message);
    } finally {
        showLoading(false);
    }
}
