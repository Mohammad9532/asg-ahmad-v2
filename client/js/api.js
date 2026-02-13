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
    dateRange.start = document.getElementById('startDate').value;
    dateRange.end = document.getElementById('endDate').value;

    allResults = {};
    sortState = {};
    searchState = {};
    document.getElementById('errorLog').classList.add('hidden');

    showLoading(true);

    // 1. Fetch Global Summary (1 request instead of 45+)
    await fetchGlobalSummary(dateRange.start, dateRange.end);

    // 2. If a shop is active, fetch its detailed data (with filteredData)
    if (activeShop !== 'OVERVIEW' && !['COMPARE', 'CUSTOMERS'].includes(activeShop)) {
        await fetchShopData(activeShop);
    }

    showLoading(false);

    // Update "Last Updated" text
    const now = new Date();
    document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();

    renderShopTabs();

    if (activeShop !== 'OVERVIEW' && !isValidDataTypeForShop(activeDataType)) {
        activeDataType = 'dashboard';
    }
    renderDataTypeTabs(activeShop);
    renderContent(activeShop, activeDataType);
}
