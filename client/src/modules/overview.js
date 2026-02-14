
import { state } from './state.js';

/**
 * overview.js
 * Handles the logic for the "Dashboard Overview" - the screen shown when no shop is selected.
 */

export function renderOverview() {
    const container = document.getElementById('dataTypeContentContainer');
    const tabsContainer = document.getElementById('dataTypeTabsContainer');
    const statusMessage = document.getElementById('statusMessage');

    if (!container) return;

    // Show status message if no shop selected
    if (!state || !state.currentShop) {
        if (tabsContainer) tabsContainer.classList.add('hidden');
        if (statusMessage) statusMessage.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    // If shop is selected, this file might provide overall metrics
    // Note: render.js currently handles the main overview dashboard.
}

// Attach to window for backward compatibility if needed, though mostly unused if render.js handles it.
window.renderOverview = renderOverview;
