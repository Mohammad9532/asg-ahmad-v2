import { SHOP_PREFIXES, BASE_URL } from './config.js';
import { formatCurrency } from './utils.js';
import { createEntry, fetchAllData } from './api.js';
import { state } from './state.js';

// Global state for Add Entry
let currentEntryType = 'booking';
let hasNewEntries = false; // Track if updates occurred
const EMPLOYEE_CACHE = {}; // Store employee lists by shop

const EXPENSE_MAPPING = {
    "Profit": {
        value: "profit",
        categories: ["donation", "salman", "family", "customer service"]
    },
    "Shop Expenses": {
        value: "shop-expense",
        categories: ["recharge", "salary", "stationary", "shop", "electric", "room", "loss", "cancel", "transport", "visa"]
    },
    "Piece Expense": {
        value: "piece-expense",
        categories: ["stitching", "folak", "fusoos", "fusoos-purchase", "khauwar", "tola", "khaka", "computer", "magribi", "qureshi", "talli", "altor", "out-statching", "sample", "material", "jheek", "delivery", "punching"]
    }
};

// --- Modal Control ---

export function openAddEntryModal() {
    const active = state.activeShop;
    if (!active || active === 'OVERVIEW' || active === 'COMPARE' || active === 'CUSTOMERS') {
        alert("Please select a specific shop from the sidebar to add entries. Global data entry is disabled to prevent mistakes.");
        return;
    }

    hasNewEntries = false; // Reset flag on open
    const modal = document.getElementById('addEntryModal');
    modal.classList.remove('hidden');

    // Load Side-by-Side Preference
    const isSXS = localStorage.getItem('sideBySideMode') !== 'false'; // Default to true
    const toggle = document.getElementById('sideBySideToggle');
    if (toggle) {
        toggle.checked = isSXS;
        applySideBySideLayout(isSXS);
    }

    // Initialize Image Viewer (listeners and state)
    initImageViewer();

    // Hook into form changes for real-time totals
    setupDailyTotalsListeners();

    // Trigger initial totals load
    loadDailyTotals();

    // Reset Last Entry Preview
    const preview = document.getElementById('lastEntryPreview');
    if (preview) {
        preview.classList.add('hidden');
        preview.innerHTML = '';
    }

    // Populate Shop Dropdown
    const shopSelect = document.getElementById('entryShop');
    if (shopSelect) {
        shopSelect.innerHTML = '';

        const option = document.createElement('option');
        option.value = active.toLowerCase(); // Use lowercase for API
        option.textContent = active;
        shopSelect.appendChild(option);

        // ALWAYS Lock the shop dropdown to the current active shop
        // This enforces "Shop Wise Data Entry" and prevents accidental global mistakes
        shopSelect.disabled = true;
        shopSelect.classList.add('bg-slate-100', 'cursor-not-allowed', 'dark:bg-slate-800');
    }

    // Initial fetch for the active shop
    if (shopSelect && shopSelect.value) {
        fetchEmployees(shopSelect.value);
    }

    // Reset to default type
    switchEntryType('booking');

    // Add Ctrl+Enter Shortcut
    modal.onkeydown = (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            const form = document.getElementById('addEntryForm');
            if (form) form.requestSubmit();
        }
    };
}

export function closeAddEntryModal() {
    document.getElementById('addEntryModal').classList.add('hidden');
    document.getElementById('addEntryForm').reset();

    // Clear image on close to free memory and reset state
    clearEntryImage();

    // Only refresh if data was actually changed
    // Use imported fetchAllData directly
    if (hasNewEntries) {
        fetchAllData();
    }
}

// --- Image Viewer Logic ---
let entryImageZoom = 1;
let isImageViewerInitialized = false;

export function toggleSideBySideMode() {
    const toggle = document.getElementById('sideBySideToggle');
    const isEnabled = toggle.checked;
    localStorage.setItem('sideBySideMode', isEnabled);
    applySideBySideLayout(isEnabled);
}

function applySideBySideLayout(isEnabled) {
    const leftCol = document.getElementById('imageViewerColumn');
    const rightCol = document.getElementById('entryFormColumn');
    const modalContent = document.querySelector('#addEntryModal > div');
    const hint = document.getElementById('pastedHint');

    if (isEnabled) {
        if (leftCol) leftCol.classList.remove('hidden');
        if (rightCol) {
            rightCol.classList.remove('md:w-full', 'max-w-2xl', 'mx-auto');
            rightCol.classList.add('md:w-1/2');
        }
        if (modalContent) {
            modalContent.classList.remove('max-w-2xl');
            modalContent.classList.add('max-w-6xl');
        }
        if (hint) hint.classList.remove('hidden');
    } else {
        if (leftCol) leftCol.classList.add('hidden');
        if (rightCol) {
            rightCol.classList.remove('md:w-1/2');
            rightCol.classList.add('md:w-full', 'max-w-2xl', 'mx-auto');
        }
        if (modalContent) {
            modalContent.classList.remove('max-w-6xl');
            modalContent.classList.add('max-w-2xl');
        }
        if (hint) hint.classList.add('hidden');
    }
}

function initImageViewer() {
    const placeholder = document.getElementById('imagePlaceholder');
    const fileInput = document.getElementById('billImageInput');

    if (!isImageViewerInitialized) {
        if (placeholder && fileInput) {
            placeholder.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                }
            };
        }

        // Paste Global Listener (attached only once)
        document.addEventListener('paste', handleGlobalPaste);
        isImageViewerInitialized = true;
    }
}

function handleGlobalPaste(e) {
    const modal = document.getElementById('addEntryModal');
    if (modal && !modal.classList.contains('hidden')) {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items) {
            const item = items[index];
            if (item.kind === 'file' && item.type.includes('image')) {
                const blob = item.getAsFile();
                handleImageFile(blob);
            }
        }
    }
}

export function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('entryImagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        const clearBtn = document.getElementById('clearImageBtn');
        const controls = document.getElementById('imageControls');

        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            placeholder.classList.add('hidden');
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (controls) controls.classList.remove('hidden');

            // Reset Zoom
            entryImageZoom = 1;
            updateImageZoom();
        }
    };
    reader.readAsDataURL(file);
}

export function clearEntryImage() {
    const preview = document.getElementById('entryImagePreview');
    const placeholder = document.getElementById('imagePlaceholder');
    const clearBtn = document.getElementById('clearImageBtn');
    const controls = document.getElementById('imageControls');
    const fileInput = document.getElementById('billImageInput');

    if (preview && placeholder) {
        preview.src = '';
        preview.classList.add('hidden');
        placeholder.classList.remove('hidden');
        if (clearBtn) clearBtn.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
        if (fileInput) fileInput.value = '';
    }
}

export function zoomImage(delta) {
    entryImageZoom += delta;
    if (entryImageZoom < 0.1) entryImageZoom = 0.1;
    if (entryImageZoom > 5) entryImageZoom = 5;
    updateImageZoom();
}

function updateImageZoom() {
    const preview = document.getElementById('entryImagePreview');
    const zoomText = document.getElementById('zoomLevel');
    if (preview) {
        preview.style.transform = `scale(${entryImageZoom})`;
        preview.style.transformOrigin = 'center center';
    }
    if (zoomText) {
        zoomText.textContent = `${Math.round(entryImageZoom * 100)}%`;
    }
}

// --- Daily Totals Logic ---

function setupDailyTotalsListeners() {
    const shopSelect = document.getElementById('entryShop');
    const form = document.getElementById('addEntryForm');

    // Listen for shop changes
    shopSelect?.addEventListener('change', loadDailyTotals);

    // Use event delegation for date changes inside the dynamic fields
    form?.addEventListener('change', (e) => {
        if (e.target.name === 'date') {
            loadDailyTotals();
        }
    });
}

let loadTotalsDebounceTimer = null;

export async function loadDailyTotals() {
    // Basic debounce to prevent rapid switching spam
    if (loadTotalsDebounceTimer) clearTimeout(loadTotalsDebounceTimer);

    loadTotalsDebounceTimer = setTimeout(async () => {
        const shop = document.getElementById('entryShop').value;
        const dateInput = document.querySelector('input[name="date"]');
        const totalContainer = document.getElementById('dailyTotalsContainer');

        // UI Elements
        const sLabel = document.getElementById('selectedDateLabel');
        const sValue = document.getElementById('selectedDateValue');
        const sCard = document.getElementById('selectedDateCard');

        const pValue = document.getElementById('previousDateValue');
        const pLabel = document.getElementById('previousDateLabel');

        if (!shop || !dateInput) return;

        const selectedDate = dateInput.value;
        if (!selectedDate) return;

        // Show container
        totalContainer?.classList.remove('hidden');

        try {
            const token = localStorage.getItem('authToken');

            // Parallel Fetch: Today and Yesterday
            const prevDateObj = new Date(selectedDate);
            prevDateObj.setDate(prevDateObj.getDate() - 1);
            const prevDateStr = prevDateObj.toISOString().split('T')[0];

            const [response, prevResponse] = await Promise.all([
                fetch(`${BASE_URL}/api/${shop}/daily_ledger?date=${selectedDate}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${BASE_URL}/api/${shop}/daily_ledger?date=${prevDateStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const [data, prevData] = await Promise.all([
                response.json(),
                prevResponse.json()
            ]);

            // Determine which metric to show based on active tab
            let typeLabel = 'Booking';
            let todayVal = data.grossBooking || 0;
            let prevVal = prevData.grossBooking || 0;
            let colorTheme = 'indigo';

            if (currentEntryType === 'delivery') {
                typeLabel = 'Delivery';
                todayVal = data.totalDelivery || 0;
                prevVal = prevData.totalDelivery || 0;
                colorTheme = 'emerald';
            } else if (currentEntryType === 'expense') {
                typeLabel = 'Expense';
                todayVal = data.totalExpense || 0;
                prevVal = prevData.totalExpense || 0;
                colorTheme = 'rose';
            }

            // Apply Card Styling
            if (sCard) {
                sCard.className = `p-3 rounded-xl border transition-all duration-300 shadow-sm ${colorTheme === 'indigo' ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/50' :
                    colorTheme === 'emerald' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                        'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50'
                    }`;
            }

            // Update UI with Pulse Effect
            if (sLabel) sLabel.textContent = `${typeLabel} Total`;
            if (pLabel) pLabel.textContent = `Prev ${typeLabel}`;

            animateValuePulse(sValue, todayVal, colorTheme);
            animateValuePulse(pValue, prevVal, 'slate');

        } catch (error) {
            console.error("Daily Totals Fetch Error:", error);
        }
    }, 50); // Small debounce
}

function animateValuePulse(element, newValue, colorTheme = 'indigo') {
    if (!element) return;
    const formatted = formatCurrency(newValue);

    // Apply theme-based color classes
    const colorClass = {
        indigo: ['text-indigo-600', 'dark:text-indigo-400'],
        emerald: ['text-emerald-600', 'dark:text-emerald-400'],
        rose: ['text-rose-600', 'dark:text-rose-400'],
        slate: ['text-slate-600', 'dark:text-slate-400']
    }[colorTheme] || ['text-indigo-600', 'dark:text-indigo-400'];

    element.classList.add('scale-105', ...colorClass);

    setTimeout(() => {
        element.textContent = formatted;
        element.classList.remove('scale-105', ...colorClass);
    }, 250);
}

// --- Dynamic Form Fields ---

export function switchEntryType(type) {
    currentEntryType = type;

    // Hide preview on switch to avoid confusion
    const preview = document.getElementById('lastEntryPreview');
    if (preview) preview.classList.add('hidden');

    // Update Tab Styling
    ['booking', 'delivery', 'expense'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (t === type) {
            btn.className = 'px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 focus:outline-none';
        } else {
            btn.className = 'px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 focus:outline-none';
        }
    });

    const container = document.getElementById('entryFields');
    container.innerHTML = ''; // Clear existing fields

    // Refresh Totals for the new type
    loadDailyTotals();

    // Trigger employee fetch if moving to expense
    if (type === 'expense') {
        const shopSelect = document.getElementById('entryShop');
        if (shopSelect && shopSelect.value) {
            fetchEmployees(shopSelect.value);
        }
    }

    const today = new Date().toISOString().split('T')[0];

    if (type === 'booking') {
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bill No <span class="text-red-500">*</span></label>
                    <input type="text" name="billNo" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" id="bookingName" name="name" autocomplete="name" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone <span class="text-red-500">*</span></label>
                    <div class="flex">
                        <select name="countryCode" class="inline-flex items-center px-2 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer w-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option value="+971" selected>UAE (+971)</option>
                            <option value="+968">OMN (+968)</option>
                            <option value="+966">KSA (+966)</option>
                            <option value="+974">QAT (+974)</option>
                            <option value="+965">KWT (+965)</option>
                        </select>
                        <input type="text" id="bookingPhone" name="phone" autocomplete="tel" class="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </div>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                    <input type="date" name="date" value="${today}" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Qty <span class="text-red-500">*</span></label>
                    <input type="number" name="qty" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select name="status" onchange="handleBookingStatusChange(this)" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="stock" selected>STOCK</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancel">CANCEL</option>
                    </select>
                </div>
                <!-- Amount Type (Hidden by default) -->
                 <div id="bookingAmountTypeField" class="hidden">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Type</label>
                    <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="cash">CASH</option>
                        <option value="atm">ATM</option>
                        <option value="adib">ADIB</option>
                    </select>
                </div>
            </div>



            <div class="flex space-x-6 mt-2 items-center">
                <div class="flex items-center">
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="advanceCheck" id="advanceCheck" onchange="toggleAdvance()" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Advance</span>
                    </label>
                    <!-- Advance Amount Input (Hidden by default) -->
                    <div id="advanceAmountField" class="hidden ml-2">
                        <input type="number" name="advance" placeholder="Amount" step="0.01" class="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    </div>
                </div>

                <label class="inline-flex items-center">
                    <input type="checkbox" name="readyMade" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                    <span class="ml-2 text-sm text-slate-700 dark:text-slate-300">Ready-Made</span>
                </label>
            </div>
        `;
    } else if (type === 'delivery') {
        container.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-1">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Bill No <span class="text-red-500">*</span></label>
                    <label class="inline-flex items-center text-xs font-normal text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input type="checkbox" name="otherAmountsCheck" id="otherAmountsCheck" onchange="toggleOtherAmounts()" class="form-checkbox h-3 w-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mr-1">
                        Other Amount
                    </label>
                </div>
                <input type="text" name="billNo" id="delBillNoInput" oninput="handleDeliveryBillNoInput(this)" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <div id="deliveryBalanceDisplay" class="text-xs mt-1 min-h-[16px] text-slate-500 font-medium"></div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date <span class="text-red-500">*</span></label>
                <input type="date" name="date" value="${today}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>

             <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount Type</label>
                <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <option value="CASH">CASH</option>
                    <option value="ADIB">ADIB (Card)</option>
                    <option value="ATM">ATM</option>
                </select>
            </div>

            <div class="col-span-1">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <input type="text" name="remarks" id="remarksInput" placeholder="Optional notes" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            </div>
        `;
    } else if (type === 'expense') {
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" name="name" list="employeeSuggestions" oninput="handleNameInput(this)" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white" id="expenseNameInput">
                    <datalist id="employeeSuggestions"></datalist>
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" name="date" value="${today}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                    <div class="relative">
                        <select name="dept" onchange="updateExpenseCategories(this)" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            ${Object.entries(EXPENSE_MAPPING).map(([label, data]) => `<option value="${data.value}">${label}</option>`).join('')}
                        </select>
                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category <span class="text-red-500">*</span></label>
                <select name="cat" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <!-- Populated dynamically -->
                </select>
            </div>
            
            <div>
                 <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                 <textarea name="message" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
            </div>
        `;
        // Trigger initial category population
        const deptSelect = container.querySelector('[name="dept"]');
        if (deptSelect) updateExpenseCategories(deptSelect);
    }
}

export function updateExpenseCategories(deptSelect) {
    const deptValue = deptSelect.value;
    const catSelect = deptSelect.closest('form').querySelector('[name="cat"]');
    if (!catSelect) return;

    catSelect.innerHTML = '';

    // Find categories by matching the value in mapping
    const mappingEntry = Object.values(EXPENSE_MAPPING).find(m => m.value === deptValue);
    const categories = mappingEntry ? mappingEntry.categories : [];

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
    });
}

export function toggleAdvance() {
    const isChecked = document.getElementById('advanceCheck').checked;
    const field = document.getElementById('advanceAmountField');
    const typeField = document.getElementById('bookingAmountTypeField');

    if (isChecked) {
        field.classList.remove('hidden');
        field.querySelector('input').focus();

        // Show Amount Type
        if (typeField) typeField.classList.remove('hidden');
    } else {
        field.classList.add('hidden');
        field.querySelector('input').value = '';

        // Hide Amount Type
        if (typeField) typeField.classList.add('hidden');
    }
}

export function toggleOtherAmounts() {
    const isChecked = document.getElementById('otherAmountsCheck').checked;
    const billInput = document.getElementById('delBillNoInput');

    if (isChecked) {
        billInput.value = 'other-amounts';
        billInput.disabled = true;
        billInput.classList.add('bg-slate-100', 'text-slate-500');
        // Focus amount if bill no is skipped
        const form = document.getElementById('addEntryForm');
        const amountInput = form.querySelector('[name="amount"]');
        if (amountInput) amountInput.focus();
    } else {
        billInput.value = '';
        billInput.disabled = false;
        billInput.classList.remove('bg-slate-100', 'text-slate-500');
        billInput.focus();

        // Reset balance display
        const balanceDisplay = document.getElementById('deliveryBalanceDisplay');
        if (balanceDisplay) balanceDisplay.innerHTML = '';
    }
}

// --- Instant Pending Balance for Delivery ---
let billNoDebounceTimer = null;

export async function handleDeliveryBillNoInput(input) {
    const value = input.value.trim();
    const display = document.getElementById('deliveryBalanceDisplay');
    if (!display) return;

    // Reset if cleared
    if (value === '') {
        display.innerHTML = '';
        return;
    }

    // Wait 400ms before triggering API fetch
    if (billNoDebounceTimer) clearTimeout(billNoDebounceTimer);

    display.innerHTML = '<span class="text-slate-400">Loading balance...</span>';

    billNoDebounceTimer = setTimeout(async () => {
        const shop = document.getElementById('entryShop')?.value;
        if (!shop) return;

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${BASE_URL}/api/${shop}/bill_details?billNo=${value}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                display.innerHTML = '<span class="text-slate-400">Failed to load bill.</span>';
                return;
            }

            const data = await res.json();

            // Check if booking exists
            if (!data.booking) {
                display.innerHTML = '<span class="text-slate-400 font-normal">Bill not found.</span>';
                return;
            }

            const bookingAmount = parseFloat(data.booking.amount || 0);

            // Calculate total delivered so far
            let deliveredAmount = 0;
            if (data.deliveries && Array.isArray(data.deliveries)) {
                deliveredAmount = data.deliveries.reduce((sum, del) => sum + parseFloat(del.amount || 0), 0);
            }

            const pending = bookingAmount - deliveredAmount;

            // Format numbers
            const fmt = (num) => new Intl.NumberFormat('en-AE').format(num);

            let colorClass = 'text-green-600 dark:text-green-400';
            if (pending > 0) {
                colorClass = 'text-rose-600 dark:text-rose-400';
            } else if (pending < 0) {
                colorClass = 'text-yellow-600 dark:text-yellow-400'; // Overpaid
            }

            display.innerHTML = `Booking: <span class="font-bold">${fmt(bookingAmount)}</span> | Delivered: <span class="font-bold">${fmt(deliveredAmount)}</span> | <span class="${colorClass} ml-1">Pending: <span class="font-bold">${fmt(pending)}</span></span>`;

        } catch (error) {
            console.error("Instant balance lookup failed:", error);
            display.innerHTML = '<span class="text-slate-400">Failed to load balance.</span>';
        }
    }, 400);
}


// --- Form Submission ---

export async function handleAddEntrySubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const shop = document.getElementById('entryShop').value;

    const payload = {};
    formData.forEach((value, key) => {
        // Handle logic separately
        if (key === 'advanceCheck' || key === 'readyMade' || key === 'otherAmountsCheck') return;
        payload[key] = value;
    });

    // Manual handling for checkboxes if they are unchecked
    if (currentEntryType === 'booking') {
        const isAdvance = form.querySelector('[name="advanceCheck"]').checked;
        if (isAdvance) {
            // "advance" input name already in payload if valid.
            const advVal = payload.advance;
            if (advVal) payload.advance = parseFloat(advVal);

            // "amountType" is already in payload because it's a select field
        } else {
            // Not Checked -> Ensure 'advance' and 'amountType' are NOT in payload
            delete payload.advance;
            delete payload.amountType;
        }

        const isReadyMade = form.querySelector('[name="readyMade"]').checked;
        if (isReadyMade) payload.readyMade = true;

        // MATCH LEGACY DATA FORMAT
        if (!payload.countryCode) payload.countryCode = '+971';

        // Re-order: noOfUpdates must come BEFORE status
        const statusVal = payload.status ? payload.status.toLowerCase() : 'stock';
        delete payload.status; // Remove from current position

        payload.noOfUpdates = 0;
        payload.status = statusVal; // Re-add to ensure it comes after noOfUpdates
    }

    if (currentEntryType === 'delivery') {
        const isOtherAmount = form.querySelector('[name="otherAmountsCheck"]').checked;
        if (isOtherAmount) {
            payload.billNo = 'other-amounts';
        }
    }


    try {
        // Map 'booking' (UI) to 'bookings' (API) to match server routes
        const apiType = currentEntryType === 'booking' ? 'bookings' : currentEntryType;

        if (currentEntryType === 'expense' && payload.name) {
            payload.name = payload.name.trim().toLowerCase();
        }

        await createEntry(shop, apiType, payload);

        // Refresh employee list if it's a new expense
        if (currentEntryType === 'expense') {
            fetchEmployees(shop);
        }

        // Success Feedback
        showToast('Entry Added Successfully!');

        // Mark as having updates
        hasNewEntries = true;

        // --- UPDATE TOTALS REAL-TIME ---
        loadDailyTotals(); // Non-blocking!

        // --- UPDATE LAST ENTRY PREVIEW ---
        const preview = document.getElementById('lastEntryPreview');
        if (preview) {
            let summary = '';
            const amountFormatted = parseFloat(payload.amount).toLocaleString('en-AE', { style: 'currency', currency: 'AED' });

            if (currentEntryType === 'booking') {
                summary = `<b>Booking Saved:</b> Bill #${payload.billNo} - ${payload.name} (${amountFormatted})`;
            } else if (currentEntryType === 'delivery') {
                summary = `<b>Delivery Saved:</b> Bill #${payload.billNo} - ${amountFormatted}`;
            } else if (currentEntryType === 'expense') {
                summary = `<b>Expense Saved:</b> ${payload.cat} - ${payload.name} (${amountFormatted})`;
            }

            preview.innerHTML = `<span>${summary}</span> <span class="text-xs text-green-600">Now</span>`;
            preview.classList.remove('hidden');
        }

        // --- SMART RESET (Bulk Entry Optimization) ---
        // We do NOT close the modal. We only clear transaction-specific fields.

        if (currentEntryType === 'booking') {
            // --- AUTO INCREMENT BILL NO ---
            const billInput = form.querySelector('[name="billNo"]');
            const lastBillNo = parseInt(payload.billNo);

            if (!isNaN(lastBillNo)) {
                billInput.value = lastBillNo + 1;
                // No selection needed on Bill No as we focus Name
            } else {
                billInput.value = '';
            }

            // Clear other fields
            const nameInput = form.querySelector('[name="name"]');
            nameInput.value = '';

            const phoneInput = form.querySelector('[name="phone"]');
            if (phoneInput) phoneInput.value = '';

            form.querySelector('[name="qty"]').value = '';
            form.querySelector('[name="amount"]').value = '';

            // Reset Advance Logic
            form.querySelector('[name="advanceCheck"]').checked = false;
            toggleAdvance(); // Hides field & Amount Type
            form.querySelector('[name="readyMade"]').checked = false;

            // Reset Defaults (Country & Status)
            const countrySelect = form.querySelector('[name="countryCode"]');
            if (countrySelect) countrySelect.value = '+971';

            const statusSelect = form.querySelector('[name="status"]');
            if (statusSelect) statusSelect.value = 'stock';

            // Focus Name as requested
            nameInput.focus();

        } else if (currentEntryType === 'delivery') {
            // Clear: BillNo, Amount, Remarks
            // Keep: Date, Shop, Amount Type
            const billInput = form.querySelector('[name="billNo"]');
            if (!billInput.disabled) billInput.value = '';

            form.querySelector('[name="amount"]').value = '';

            const remarksInput = document.getElementById('remarksInput');
            if (remarksInput) remarksInput.value = '';

            // Clear Balance Display
            const balanceDisplay = document.getElementById('deliveryBalanceDisplay');
            if (balanceDisplay) balanceDisplay.innerHTML = '';

            // Focus appropriate field
            billInput.focus();

        } else if (currentEntryType === 'expense') {
            // Clear: Amount, Name, Message
            // Keep: Date, Dept, Category
            form.querySelector('[name="amount"]').value = '';
            form.querySelector('[name="name"]').value = '';
            form.querySelector('[name="message"]').value = '';

            // Focus name
            form.querySelector('[name="name"]').focus();
        }

    } catch (error) {
        alert(error.message);
    }
}

export function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-20 opacity-0 z-[60]';
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="font-medium">${message}</span>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

export function handleBookingStatusChange(selectElem) {
    if (selectElem.value === 'cancel') {
        const form = document.getElementById('addEntryForm');

        const nameInput = form.querySelector('[name="name"]');
        if (nameInput) nameInput.value = "Cancelled";

        const phoneInput = form.querySelector('[name="phone"]');
        if (phoneInput) phoneInput.value = "-";

        const qtyInput = form.querySelector('[name="qty"]');
        if (qtyInput) qtyInput.value = "0";

        const amountInput = form.querySelector('[name="amount"]');
        if (amountInput) amountInput.value = "0";
    }
}

// --- Employee Autofill Logic ---

export async function fetchEmployees(shop) {
    if (!shop) return;

    // Check Cache first? Or always fetch fresh to get latest?
    // Let's fetch fresh for now, it's small data.
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${BASE_URL}/api/${shop}/expense/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const employees = await response.json();
            EMPLOYEE_CACHE[shop] = employees;
            updateEmployeeDatalist(shop);
        }
    } catch (err) {
        // Essential error log for debugging
        console.error("Employee fetch failed:", err);
    }
}

function updateEmployeeDatalist(shop) {
    const list = document.getElementById('employeeSuggestions');
    if (!list) return;

    list.innerHTML = '';
    const employees = EMPLOYEE_CACHE[shop] || [];

    employees.forEach(emp => {
        const option = document.createElement('option');
        // Value is the name (what gets put in input)
        option.value = emp.name;
        // Label could show extra info
        // option.label = `${emp.dept} > ${emp.cat}`; 
        list.appendChild(option);
    });
}


export function handleNameInput(input) {
    const val = input.value.trim().toLowerCase();
    // Prevent premature jump for very short names (e.g., typing 'M' when meaning 'Mess')
    // We only trigger autofill and jump if length >= 3
    if (val.length < 3) return;

    const shop = document.getElementById('entryShop').value;
    const employees = EMPLOYEE_CACHE[shop] || [];

    // Find exact match (case insensitive, trimmed)
    const match = employees.find(e => (e.name || '').trim().toLowerCase() === val);

    if (match) {
        const form = input.closest('form');
        const deptSelect = form.querySelector('[name="dept"]');
        const catSelect = form.querySelector('[name="cat"]');
        const amountInput = form.querySelector('[name="amount"]');

        // 1. Set Department
        if (deptSelect && match.dept) {
            const matchDept = String(match.dept).trim().toLowerCase();
            deptSelect.value = matchDept;
            // Trigger category update
            updateExpenseCategories(deptSelect);

            // 2. Set Category (after options populate)
            if (catSelect && match.cat) {
                catSelect.value = String(match.cat).trim().toLowerCase();
            }
        }

        // 3. AUTO FOCUS AMOUNT (Always move focus if match is found)
        if (amountInput) {
            setTimeout(() => amountInput.focus(), 10);
        }
    }
}

// Make accessible globally for HTML event handlers
window.openAddEntryModal = openAddEntryModal;
window.closeAddEntryModal = closeAddEntryModal;
window.switchEntryType = switchEntryType;
window.toggleAdvance = toggleAdvance;
window.toggleOtherAmounts = toggleOtherAmounts;
window.handleAddEntrySubmit = handleAddEntrySubmit;
window.handleBookingStatusChange = handleBookingStatusChange;
window.updateExpenseCategories = updateExpenseCategories;
window.toggleSideBySideMode = toggleSideBySideMode;
window.clearEntryImage = clearEntryImage;
window.zoomImage = zoomImage;
window.handleNameInput = handleNameInput;
window.closeEntryReceiptModal = closeEntryReceiptModal;
window.printEntryReceipt = printEntryReceipt;

// --- Entry Receipt Modal Logic ---

async function showEntryReceiptModal(shop, dateStr, payload, type) {
    const modal = document.getElementById('entryReceiptModal');
    if (!modal) return;

    // Set Header
    const headerTitle = type.charAt(0).toUpperCase() + type.slice(1) + ' Info';
    document.getElementById('receiptEntryTypeHeader').textContent = headerTitle.slice(1);
    const firstLetter = document.querySelector('#receiptEntryTypeHeader').previousElementSibling;
    firstLetter.textContent = headerTitle.charAt(0);

    // Build Top Info based on type
    const detailsContainer = document.getElementById('receiptEntryDetails');
    let detailsHtml = '';

    const addRow = (label, value) => {
        if (value !== undefined && value !== '') {
            detailsHtml += `<div class="flex justify-between border-b border-gray-800 pb-2">
                <span class="text-gray-400 font-medium tracking-wide">${label}</span>
                <span class="text-blue-400 font-bold">${value}</span>
            </div>`;
        }
    };

    if (type === 'booking') {
        addRow('Bill No:-', payload.billNo);
        addRow('Name', payload.name);
        addRow('Phone', payload.phone);
        addRow('Date', dateStr.split('-').reverse().join('-'));
        addRow('Quantity', payload.qty);
        addRow('Amount', payload.amount);
        if (payload.advance) addRow('Advance', payload.advance);
        addRow('Piece Status', (payload.status || 'STOCK').toUpperCase());
    } else if (type === 'delivery') {
        addRow('Bill No:-', payload.billNo);
        addRow('Date', dateStr.split('-').reverse().join('-'));
        addRow('Amount', payload.amount);
        addRow('Type', (payload.amountType || 'CASH').toUpperCase());
        addRow('Remarks', payload.remarks);
    } else if (type === 'expense') {
        addRow('Name', payload.name);
        addRow('Date', dateStr.split('-').reverse().join('-'));
        addRow('Department', payload.dept);
        addRow('Category', payload.cat);
        addRow('Amount', payload.amount);
    }
    detailsContainer.innerHTML = detailsHtml;

    // Fetch Daily Totals for Bottom Section
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${BASE_URL}/api/${shop}/daily_ledger?date=${dateStr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        // 1. Booking Column
        document.getElementById('rBookingDate').textContent = dateStr.split('-').reverse().join('-');
        document.getElementById('rBookingStock').textContent = data.grossBooking || 0;

        let totalAdvance = 0;
        if (data.entries) {
            data.entries.forEach(e => {
                if (e.dataType === 'delivery' && e.raw && e.raw.amountType && String(e.raw.amountType).toLowerCase() !== 'other-amounts') {
                    // A rough estimate for advance if not stored separately
                    totalAdvance += (e.amount || 0);
                }
            });
        }
        document.getElementById('rBookingAdvance').textContent = totalAdvance;
        document.getElementById('rBookingTotal').textContent = data.grossBooking || 0;

        // 2. Delivery Column
        document.getElementById('rDeliveryDate').textContent = dateStr.split('-').reverse().join('-');
        document.getElementById('rDeliveryATM').textContent = (data.deliveryBreakdown && data.deliveryBreakdown['ATM']) || 0;
        document.getElementById('rDeliveryADIB').textContent = (data.deliveryBreakdown && data.deliveryBreakdown['ADIB']) || 0;
        document.getElementById('rDeliveryCASH').textContent = (data.deliveryBreakdown && data.deliveryBreakdown['CASH']) || 0;
        document.getElementById('rDeliveryTotal').textContent = data.totalDelivery || 0;

        // 3. Expense Column
        document.getElementById('rExpenseDate').textContent = dateStr.split('-').reverse().join('-');

        const expenseCategories = {};
        if (data.entries) {
            data.entries.forEach(e => {
                if (e.dataType === 'expense') {
                    const cat = e.category ? String(e.category).toUpperCase() : 'GENERAL';
                    expenseCategories[cat] = (expenseCategories[cat] || 0) + (e.amount || 0);
                }
            });
        }

        const catContainer = document.getElementById('rExpenseCategories');
        if (Object.keys(expenseCategories).length === 0) {
            catContainer.innerHTML = `<div class="flex justify-between border-b border-gray-800 pb-2"><span class="text-gray-400 uppercase">None</span><span class="text-gray-200 text-right">0</span></div>`;
        } else {
            catContainer.innerHTML = Object.entries(expenseCategories).map(([cat, amount]) => `
                <div class="flex justify-between border-b border-gray-800 pb-2">
                    <span class="text-gray-400 uppercase">${cat}</span>
                    <span class="text-gray-200 text-right">${amount}</span>
                </div>
            `).join('');
        }

        let totalExp = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
        document.getElementById('rExpenseTotal').textContent = totalExp;

    } catch (e) {
        console.error("Failed to fetch receipt data", e);
    }

    // Show Modal
    modal.classList.remove('hidden');
    // slight delay for transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
    }, 10);
}

function closeEntryReceiptModal() {
    const modal = document.getElementById('entryReceiptModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function printEntryReceipt() {
    const printArea = document.getElementById('receiptPrintArea');
    const opt = {
        margin: 1,
        filename: `Receipt_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printArea).save();
}

// Initialize Global Listeners
document.addEventListener('DOMContentLoaded', () => {
    const shopSelect = document.getElementById('entryShop');
    if (shopSelect) {
        shopSelect.addEventListener('change', () => fetchEmployees(shopSelect.value));
    }
});
