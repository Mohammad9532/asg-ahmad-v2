
import { state } from './state.js';
import { SHOP_PREFIXES } from './config.js';
import { renderShopTabs, renderDataTypeTabs } from './ui.js';
import { fetchShopData, fetchAllData } from './api.js';
import { renderContent } from './render.js';

// --- ROUTING LOGIC ---

window.addEventListener('popstate', handleRouting);

/**
 * Main entry point for URL-based navigation.
 * Parses the current pathname and updates the application state.
 */
export async function handleRouting() {
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
        } else {
            // Case-insensitive lookup to find the canonical prefix
            const found = SHOP_PREFIXES.find(s => s.toUpperCase() === seg);
            if (found) shop = found;
        }
    } else if (segments.length >= 2) {
        const seg1 = segments[0].toUpperCase();
        const found = SHOP_PREFIXES.find(s => s.toUpperCase() === seg1);
        if (found) {
            shop = found;
            type = segments[1].toLowerCase();
            if (type === 'employees') type = 'employee'; // Normalize
        }
    }

    // --- RBAC Guard ---
    const isAdmin = state.user && state.user.role === 'admin';
    const userShop = state.user ? state.user.shop : null;

    if (!isAdmin && userShop) {
        // Shop role can only see their shop and the Customers list
        const isSelfShop = shop.toLowerCase() === userShop.toLowerCase();
        const isAuthorized = isSelfShop || shop === 'CUSTOMERS';

        if (!isAuthorized) {
            console.warn(`[AUTH] Restricted user attempted access to ${shop}. Redirecting to ${userShop}.`);
            shop = userShop;
        }
    }

    // Update Global State
    if (state.activeShop !== shop) {
        state.activeShop = shop;
    }

    if (state.activeDataType !== type) {
        state.activeDataType = type;
    }

    // Synchronize UI and Data
    await syncViewWithURL();
}

/**
 * Updates UI components (tabs, sidebar) and triggers data loading if necessary.
 */
async function syncViewWithURL() {
    // 1. Update Tabs & Sidebar active states
    renderShopTabs();
    renderDataTypeTabs(state.activeShop);

    // 2. Automatic Data Fetching
    const isSpecial = state.activeShop === 'OVERVIEW' || state.activeShop === 'COMPARE' || state.activeShop === 'CUSTOMERS';

    if (!isSpecial) {
        // If shop data isn't loaded, fetch it
        if (!state.allResults[`${state.activeShop}|FULL_LOADED`]) {
            await fetchShopData(state.activeShop);
        }
    } else {
        // Use GLOBAL|LOADED flag for reliability
        if (!state.allResults['GLOBAL|LOADED']) {
            await fetchAllData();
        }
    }

    // 3. Final Render
    renderContent(state.activeShop, state.activeDataType);
}

/**
 * Programmatic navigation helper.
 * Updates the URL and triggers the router.
 */
export function navigateTo(shop, type = 'dashboard') {
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
