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

function openAddEntryModal() {
    hasNewEntries = false; // Reset flag on open
    const modal = document.getElementById('addEntryModal');
    modal.classList.remove('hidden');

    // Reset Last Entry Preview
    const preview = document.getElementById('lastEntryPreview');
    if (preview) {
        preview.classList.add('hidden');
        preview.innerHTML = '';
    }

    // Populate Shop Dropdown
    const shopSelect = document.getElementById('entryShop');
    shopSelect.innerHTML = '';

    // Use the global SHOP_PREFIXES array from config.js
    const shops = typeof SHOP_PREFIXES !== 'undefined' ? SHOP_PREFIXES : [
        'Albarieklamaa', 'Algaidamadam', 'Gaidamnasir', 'Gaidatailor',
        'Galaxybranch', 'Galaxyzakhir', 'Gawanimadam', 'Naseem', 'Staralgawani'
    ];

    shops.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop.toLowerCase(); // Use lowercase for API
        option.textContent = shop;
        shopSelect.appendChild(option);
    });

    // Fetch Employees Filtered by CURRENT shop (initially first one or default)
    // We'll update this whenever shop changes too (listener needed?)
    // For now, let's attach a listener to shop select
    shopSelect.addEventListener('change', () => fetchEmployees(shopSelect.value));

    // Initial fetch for the first/default shop
    if (shopSelect.value) {
        fetchEmployees(shopSelect.value);
    }

    // Default to currently selected shop if possible, else first one
    // (Assuming there's a way to know current shop context, otherwise default)

    // Reset to default type
    switchEntryType('booking');
}

function closeAddEntryModal() {
    document.getElementById('addEntryModal').classList.add('hidden');
    document.getElementById('addEntryForm').reset();

    // Only refresh if data was actually changed
    if (hasNewEntries && window.fetchAllData) {
        window.fetchAllData();
    }
}

// --- Dynamic Form Fields ---

function switchEntryType(type) {
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
                <input type="text" name="billNo" id="delBillNoInput" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
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
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" name="date" value="${today}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                </div>
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

             <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category <span class="text-red-500">*</span></label>
                    <select name="cat" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <!-- Populated dynamically -->
                    </select>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" name="name" list="employeeSuggestions" oninput="handleNameInput(this)" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                    <datalist id="employeeSuggestions"></datalist>
                </div>
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

function updateExpenseCategories(deptSelect) {
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

function toggleAdvance() {
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

function toggleOtherAmounts() {
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
    }
}


// --- Form Submission ---

async function handleAddEntrySubmit(event) {
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
            payload.name = payload.name.toLowerCase();
        }

        await createEntry(shop, apiType, payload);

        // Success Feedback
        showToast('Entry Added Successfully!');

        // Mark as having updates
        hasNewEntries = true;

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

            // Focus appropriate field
            billInput.focus();

        } else if (currentEntryType === 'expense') {
            // Clear: Amount, Name, Message
            // Keep: Date, Dept, Category
            form.querySelector('[name="amount"]').value = '';
            form.querySelector('[name="name"]').value = '';
            form.querySelector('[name="message"]').value = '';

            // Focus amount
            form.querySelector('[name="amount"]').focus();
        }

    } catch (error) {
        alert(error.message);
    }
}

function showToast(message) {
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

function handleBookingStatusChange(selectElem) {
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

async function fetchEmployees(shop) {
    if (!shop) return;

    // Check Cache first? Or always fetch fresh to get latest?
    // Let's fetch fresh for now, it's small data.
    try {
        console.log(`[DEBUG] Fetching employees for shop: ${shop}`);
        const response = await fetch(`${API_BASE_URL}/${shop}/expense/employees`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const employees = await response.json();
            console.log(`[DEBUG] Fetched ${employees.length} employees`, employees);
            EMPLOYEE_CACHE[shop] = employees;
            updateEmployeeDatalist(shop);
        } else {
            console.error(`[DEBUG] Failed to fetch employees: ${response.status}`);
        }
    } catch (err) {
        console.error("Failed to fetch employees", err);
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
    console.log(`[DEBUG] Updated datalist with ${employees.length} options`);
}

// When user switches to Expense tab, we should ensure datalist is populated for current shop
const originalSwitch = switchEntryType;
switchEntryType = function (type) {
    originalSwitch(type);
    if (type === 'expense') {
        const shopSelect = document.getElementById('entryShop');
        if (shopSelect && shopSelect.value) {
            updateEmployeeDatalist(shopSelect.value);
        }
    }
};

function handleNameInput(input) {
    const val = input.value.toLowerCase();
    const shop = document.getElementById('entryShop').value;
    const employees = EMPLOYEE_CACHE[shop] || [];

    // Find exact match (case insensitive)
    const match = employees.find(e => e.name.toLowerCase() === val);

    if (match) {
        const form = input.closest('form');
        const deptSelect = form.querySelector('[name="dept"]');
        const catSelect = form.querySelector('[name="cat"]');

        // 1. Set Department
        if (deptSelect && match.dept) {
            deptSelect.value = match.dept;
            // Trigger category update
            updateExpenseCategories(deptSelect);

            // 2. Set Category (after options populate)
            // We need to wait for updateExpenseCategories to finish (it's sync, so we're good)
            if (catSelect && match.cat) {
                catSelect.value = match.cat;
            }
        }
    }
}
