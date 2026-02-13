/**
 * overview.js
 * Handles the logic for the "Dashboard Overview" - the screen shown when no shop is selected.
 */

window.renderOverview = function () {
    const container = document.getElementById('dataTypeContentContainer');
    const tabsContainer = document.getElementById('dataTypeTabsContainer');
    const statusMessage = document.getElementById('statusMessage');

    if (!container) return;

    // Show status message if no shop selected
    if (!window.state || !window.state.currentShop) {
        if (tabsContainer) tabsContainer.classList.add('hidden');
        if (statusMessage) statusMessage.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    // If shop is selected, this file might provide overall metrics
};

// Listen for custom events if needed
document.addEventListener('DOMContentLoaded', () => {
    // Initial check
    if (typeof renderOverview === 'function') {
        renderOverview();
    }
});
