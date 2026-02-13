// --- MAIN ENTRY POINT ---

// Setup Global Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Auth Check
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize UI Components
    initDarkMode();
    initFiscalYearDropdown();

    // 3. Set Default Date Range (This Month) if not already set by Fiscal Year logic
    // initFiscalYearDropdown might set it if it matches a stored preference or current date.
    // However, if inputs are empty, force 'thisMonth'.
    const startVal = document.getElementById('startDate').value;
    if (!startVal) {
        setDateRange('thisMonth');
    } else {
        // If persisted values exist (from browser cache), ensure global state matches
        dateRange.start = document.getElementById('startDate').value;
        dateRange.end = document.getElementById('endDate').value;
    }

    // 4. Initial Routing (Determines what to show based on URL)
    if (typeof handleRouting === 'function') {
        handleRouting();
    }
});


// Global Action Functions
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}
