// Global state for Add Entry
let currentEntryType = 'booking';
let hasNewEntries = false; // Track if updates occurred

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
                    <label class="block text-sm font-medium text-slate-700 mb-1">Bill No <span class="text-red-500">*</span></label>
                    <input type="text" name="billNo" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" name="name" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Phone <span class="text-red-500">*</span></label>
                    <div class="flex">
                        <select name="countryCode" class="inline-flex items-center px-2 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer w-24">
                            <option value="+971" selected>UAE (+971)</option>
                            <option value="+968">OMN (+968)</option>
                            <option value="+966">KSA (+966)</option>
                            <option value="+974">QAT (+974)</option>
                            <option value="+965">KWT (+965)</option>
                        </select>
                        <input type="text" name="phone" class="flex-1 w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input type="date" name="date" value="${today}" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Qty <span class="text-red-500">*</span></label>
                    <input type="number" name="qty" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" onchange="handleBookingStatusChange(this)" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="stock" selected>STOCK</option>
                        <option value="delivered">DELIVERED</option>
                        <option value="cancel">CANCEL</option>
                    </select>
                </div>
                <!-- Amount Type (Hidden by default) -->
                 <div id="bookingAmountTypeField" class="hidden">
                    <label class="block text-sm font-medium text-slate-700 mb-1">Amount Type</label>
                    <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="cash">CASH</option>
                        <option value="atm">ATM</option>
                        <option value="adib">ADIB</option>
                        <option value="other">OTHER</option>
                    </select>
                </div>
            </div>



            <div class="flex space-x-6 mt-2 items-center">
                <div class="flex items-center">
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="advanceCheck" id="advanceCheck" onchange="toggleAdvance()" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                        <span class="ml-2 text-sm text-slate-700">Advance</span>
                    </label>
                    <!-- Advance Amount Input (Hidden by default) -->
                    <div id="advanceAmountField" class="hidden ml-2">
                        <input type="number" name="advance" placeholder="Amount" step="0.01" class="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                </div>

                <label class="inline-flex items-center">
                    <input type="checkbox" name="readyMade" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                    <span class="ml-2 text-sm text-slate-700">Ready-Made</span>
                </label>
            </div>
        `;
    } else if (type === 'delivery') {
        container.innerHTML = `
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Bill No <span class="text-red-500" id="delBillNoReq">*</span></label>
                <input type="text" name="billNo" id="delBillNoInput" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Date <span class="text-red-500">*</span></label>
                <input type="date" name="date" value="${today}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Amount <span class="text-red-500">*</span></label>
                <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>

             <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Amount Type</label>
                <select name="amountType" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="CASH">CASH</option>
                    <option value="ADIB">ADIB (Card)</option>
                    <option value="ATM">ATM</option>
                    <option value="OTHER">OTHER</option>
                </select>
            </div>

            <div class="mt-2">
                 <label class="inline-flex items-center">
                    <input type="checkbox" id="otherAmountsCheck" onchange="toggleOtherAmounts()" class="form-checkbox h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                    <span class="ml-2 text-sm text-slate-700">Other Amounts (No Bill No)</span>
                </label>
            </div>

            <!-- Hidden Remarks field for Other Amounts -->
             <div id="remarksField" class="hidden">
                <label class="block text-sm font-medium text-slate-700 mb-1">Remarks / Name <span class="text-red-500">*</span></label>
                <input type="text" name="remarks" id="remarksInput" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>
        `;
    } else if (type === 'expense') {
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Amount <span class="text-red-500">*</span></label>
                    <input type="number" name="amount" required step="0.01" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Date <span class="text-red-500">*</span></label>
                    <input type="date" name="date" value="${today}" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <div class="relative">
                    <select name="dept" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white">
                        <option value="PROFIT">PROFIT</option>
                        <option value="EXPENSE">EXPENSE</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

             <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Category <span class="text-red-500">*</span></label>
                    <input type="text" name="cat" required placeholder="Search..." class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                 <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" name="name" required class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                </div>
            </div>
            
            <div>
                 <label class="block text-sm font-medium text-slate-700 mb-1">Message</label>
                 <textarea name="message" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            </div>
        `;
    }
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
    const billReq = document.getElementById('delBillNoReq');
    const remarksDiv = document.getElementById('remarksField');
    const remarksInput = document.getElementById('remarksInput');

    if (isChecked) {
        // Disable Bill No, make it optional
        billInput.disabled = true;
        billInput.value = 'other-amounts'; // Auto-fill for backend logic
        billInput.classList.add('bg-slate-100', 'text-slate-500');
        billReq.classList.add('hidden');

        // Show Remarks, make required
        remarksDiv.classList.remove('hidden');
        remarksInput.required = true;
    } else {
        // Enable Bill No, make required
        billInput.disabled = false;
        billInput.value = '';
        billInput.classList.remove('bg-slate-100', 'text-slate-500');
        billReq.classList.remove('hidden');

        // Hide Remarks, make optional
        remarksDiv.classList.add('hidden');
        remarksInput.required = false;
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
        if (key === 'advanceCheck' || key === 'readyMade') return;
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

    // Fix for Delivery "Other Amounts" - ensure remarks are sent if checked
    if (currentEntryType === 'delivery') {
        const otherChecked = document.getElementById('otherAmountsCheck').checked;
        if (otherChecked) {
            payload.billNo = 'other-amounts'; // Explicitly set if disabled
        }
    }

    try {
        // Map 'booking' (UI) to 'bookings' (API) to match server routes
        const apiType = currentEntryType === 'booking' ? 'bookings' : currentEntryType;

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
                const ref = payload.billNo === 'other-amounts' ? payload.remarks : `Bill #${payload.billNo}`;
                summary = `<b>Delivery Saved:</b> ${ref} - ${amountFormatted}`;
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
            if (!billInput.disabled) billInput.focus();
            else if (remarksInput) remarksInput.focus();

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
