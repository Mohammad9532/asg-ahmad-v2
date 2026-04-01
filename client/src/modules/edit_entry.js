import { BASE_URL } from './config.js';
import { state } from './state.js';

let currentEditEntry = null;
let currentEditType = null;
let currentEditShop = null;

export function openEditModal(encodedEntry, dataType, shopPrefix) {
    try {
        const entryData = JSON.parse(decodeURIComponent(encodedEntry));
        currentEditEntry = entryData;
        currentEditType = dataType;
        currentEditShop = shopPrefix;

        // Reset form
        document.getElementById('editEntryForm').reset();

        // Show/Hide fields based on dataType
        const isBooking = dataType === 'bookings';
        const isExpense = dataType === 'expense';
        const isDelivery = dataType === 'delivery';

        document.getElementById('editGroupDate').classList.remove('hidden');
        document.getElementById('editGroupAmount').classList.remove('hidden');

        document.getElementById('editGroupBillNo').classList.toggle('hidden', isExpense);
        document.getElementById('editGroupType').classList.toggle('hidden', !isDelivery);
        document.getElementById('editGroupStatus').classList.toggle('hidden', !isBooking && !isDelivery && !isExpense);

        // Expense/Booking specific
        document.getElementById('editGroupDept').classList.toggle('hidden', !isExpense);
        document.getElementById('editGroupCat').classList.toggle('hidden', !isExpense);
        document.getElementById('editGroupName').classList.toggle('hidden', !isExpense && !isBooking);

        // Booking specific
        document.getElementById('editGroupPhone').classList.toggle('hidden', !isBooking);
        document.getElementById('editGroupQty').classList.toggle('hidden', !isBooking);

        // Populate values
        document.getElementById('editId').value = entryData._id;

        if (entryData.date) {
            document.getElementById('editDate').value = new Date(entryData.date).toISOString().split('T')[0];
        }
        if (entryData.amount !== undefined) document.getElementById('editAmount').value = entryData.amount;
        if (entryData.billNo) document.getElementById('editBillNo').value = entryData.billNo;
        if (entryData.name) document.getElementById('editName').value = entryData.name;
        if (entryData.status) document.getElementById('editStatus').value = entryData.status;

        if (isExpense) {
            if (entryData.dept) document.getElementById('editDept').value = entryData.dept;
            if (entryData.cat) document.getElementById('editCat').value = entryData.cat;
        }

        if (isDelivery) {
            if (entryData.amountType) document.getElementById('editType').value = entryData.amountType;
        }

        if (isBooking) {
            if (entryData.countryCode) document.getElementById('editCountryCode').value = entryData.countryCode;
            if (entryData.phone) document.getElementById('editPhone').value = entryData.phone;
            if (entryData.qty) document.getElementById('editQty').value = entryData.qty;
        }

        document.getElementById('editEntryModalTitle').innerText = `Edit ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`;
        const modal = document.getElementById('editEntryModal');
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0', 'scale-95'), 10);

    } catch (e) {
        console.error("Failed to parse entry data for edit", e);
        alert("Could not load entry for editing.");
    }
}

export function closeEditModal() {
    const modal = document.getElementById('editEntryModal');
    modal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        currentEditEntry = null;
    }, 200);
}

export async function handleEditSubmit(event) {
    event.preventDefault();
    if (!currentEditEntry || !currentEditShop || !currentEditType) return;

    const btn = document.getElementById('editSubmitBtn');
    btn.disabled = true;
    const origText = btn.innerText;
    btn.innerText = 'Saving...';

    try {
        const payload = {
            date: document.getElementById('editDate').value,
            amount: document.getElementById('editAmount').value
        };

        const isBooking = currentEditType === 'bookings';
        const isExpense = currentEditType === 'expense';
        const isDelivery = currentEditType === 'delivery';

        if (!isExpense) payload.billNo = document.getElementById('editBillNo').value;
        if (isBooking || isExpense) payload.name = document.getElementById('editName').value;

        const statusVal = document.getElementById('editStatus').value;
        if (statusVal) payload.status = statusVal;

        if (isExpense) {
            payload.dept = document.getElementById('editDept').value;
            payload.cat = document.getElementById('editCat').value;
        }

        if (isDelivery) {
            payload.amountType = document.getElementById('editType').value;
        }

        if (isBooking) {
            payload.countryCode = document.getElementById('editCountryCode').value;
            payload.phone = document.getElementById('editPhone').value;
            payload.qty = document.getElementById('editQty').value;
        }

        const url = `${BASE_URL}/api/${currentEditShop}/${currentEditType}/update/${currentEditEntry._id}`;
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(await response.text());

        // Clear cache so it refetches
        if (state.allResults) {
            Object.keys(state.allResults).forEach(key => {
                delete state.allResults[key];
            });
        }

        closeEditModal();

        // Refresh view: renderContent if defined globally (it is in main.js)
        if (typeof window.renderContent === 'function') {
            window.renderContent(currentEditShop, currentEditType);
        }

        // If daily ledger is active, refresh it
        const dateInput = document.querySelector('input[type="date"]');
        if (typeof window.renderDailyLedger === 'function' && dateInput) {
            window.renderDailyLedger(currentEditShop, dateInput.value);
        }

        // Ensure any active views are updated
        if (document.getElementById('billDetailsModal') && !document.getElementById('billDetailsModal').classList.contains('hidden')) {
            const currentBillNo = currentEditEntry.billNo || document.getElementById('editBillNo').value;
            if (currentBillNo && typeof window.showBillDetails === 'function') {
                window.showBillDetails(currentEditShop, currentBillNo);
            }
        }

        // Show toast or alert
        const toast = document.getElementById('toast');
        if (toast) {
            toast.innerText = "Entry updated successfully!";
            toast.className = "fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-[70] animate-slide-up font-bold text-sm tracking-wide flex items-center gap-2";
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => toast.className = "hidden", 500);
            }, 3000);
        } else {
            alert("Entry updated successfully!");
        }

    } catch (error) {
        alert("Failed to update entry: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = origText;
    }
}
