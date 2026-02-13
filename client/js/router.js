// --- ROUTING LOGIC ---

window.addEventListener('popstate', handleRouting);

/**
 * Main entry point for URL-based navigation.
 * Parses the current pathname and updates the application state.
 */
async function handleRouting() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    let shop = 'OVERVIEW';
    let type = 'dashboard';

    if (segments.length === 1) {
        const seg = segments[0].toUpperCase();
        if (seg === 'GLOBALOVERVIEW' || seg === 'INDEX.HTML' || seg === 'DASHBOARD') {
            shop = 'OVERVIEW';
        } else if (seg === 'TARGET-COMPARE' || seg === 'COMPARE') {
            shop = 'COMPARE';
        } else if (seg === 'CUSTOMERS') {
            shop = 'CUSTOMERS';
        } else if (typeof SHOP_PREFIXES !== 'undefined') {
            // Case-insensitive lookup to find the canonical prefix
            const found = SHOP_PREFIXES.find(s => s.toUpperCase() === seg);
            if (found) shop = found;
        }
    } else if (segments.length >= 2) {
        const seg1 = segments[0].toUpperCase();
        if (typeof SHOP_PREFIXES !== 'undefined') {
            const found = SHOP_PREFIXES.find(s => s.toUpperCase() === seg1);
            if (found) {
                shop = found;
                type = segments[1].toLowerCase();
            }
        }
    }

    // Update Global State
    if (typeof activeShop !== 'undefined' && activeShop !== shop) {
        activeShop = shop;
    }

    if (typeof activeDataType !== 'undefined') {
        activeDataType = type;
    }

    // Synchronize UI and Data
    await syncViewWithURL();
}

/**
 * Updates UI components (tabs, sidebar) and triggers data loading if necessary.
 */
async function syncViewWithURL() {
    // 1. Update Tabs & Sidebar active states
    if (typeof renderShopTabs === 'function') renderShopTabs();
    if (typeof renderDataTypeTabs === 'function') renderDataTypeTabs(activeShop);

    // 2. Automatic Data Fetching
    const isSpecial = activeShop === 'OVERVIEW' || activeShop === 'COMPARE' || activeShop === 'CUSTOMERS';

    if (!isSpecial) {
        // If shop data isn't loaded, fetch it
        if (!allResults[`${activeShop}|FULL_LOADED`] && typeof fetchShopData === 'function') {
            await fetchShopData(activeShop);
        }
    } else {
        // Use GLOBAL|LOADED flag for reliability
        if (!allResults['GLOBAL|LOADED'] && typeof fetchAllData === 'function') {
            await fetchAllData();
        }
    }

    // 3. Final Render
    if (typeof renderContent === 'function') {
        renderContent(activeShop, activeDataType);
    }
}

/**
 * Programmatic navigation helper.
 * Updates the URL and triggers the router.
 */
function navigateTo(shop, type = 'dashboard') {
    let path = '/';

    if (shop === 'OVERVIEW') path = '/globaloverview';
    else if (shop === 'COMPARE') path = '/target-compare';
    else if (shop === 'CUSTOMERS') path = '/customers';
    else {
        path = `/${shop.toLowerCase()}`;
        if (type !== 'dashboard') {
            path += `/${type}`;
        }
    }

    if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
        handleRouting();
    }
}
