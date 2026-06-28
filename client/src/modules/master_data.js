import { BASE_URL } from './config.js';

let MASTER_DATA_CACHE = [];

export async function fetchMasterData() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${BASE_URL}/api/master/expenses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            MASTER_DATA_CACHE = await res.json();
            renderMasterDataList();
            
            // Auto-fill ID once data is loaded if creating new employee
            const editId = document.getElementById('mdEditId')?.value;
            if (!editId) {
                updateMasterIdLabel();
            }
            return MASTER_DATA_CACHE;
        }
    } catch (err) {
        console.error("Failed to fetch master data:", err);
    }
    return [];
}

export function getMasterDataCache() {
    return MASTER_DATA_CACHE;
}

export function openMasterDataModal() {
    const modal = document.getElementById('masterDataModal');
    if (!modal) return;
    
    // Refresh list when opening
    fetchMasterData();
    
    // Initial category population
    const deptSelect = document.getElementById('mdDept');
    if (deptSelect && deptSelect.options.length === 0) {
        // Need to wait for EXPENSE_MAPPING if imported, or just define it here/import it
        // Since EXPENSE_MAPPING is in add_entry.js, let's just trigger a click or re-use it
        populateMasterDepartments();
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0', 'scale-95');
    }, 10);
}

export function closeMasterDataModal() {
    const modal = document.getElementById('masterDataModal');
    if (!modal) return;
    modal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        resetMasterDataForm();
    }, 300);
}

export function getNextEmployeeId() {
    let maxNum = 0;
    let prefix = '';
    let padLength = 0;

    MASTER_DATA_CACHE.forEach(item => {
        if (item.type === 'employee') {
            const match = item.targetId.match(/^(\D*)(\d+)/);
            if (match) {
                const num = parseInt(match[2], 10);
                if (num > maxNum) {
                    maxNum = num;
                    prefix = match[1];
                    padLength = match[2].length;
                }
            }
        }
    });

    if (maxNum === 0) {
        return "1";
    }
    
    let nextIdStr = (maxNum + 1).toString();
    if (nextIdStr.length < padLength && prefix !== '') {
        nextIdStr = nextIdStr.padStart(padLength, '0');
    }
    
    return `${prefix}${nextIdStr}`;
}

export function updateMasterIdLabel() {
    const type = document.getElementById('mdType')?.value || 'employee';
    const container = document.getElementById('mdTargetIdContainer');
    const label = document.getElementById('mdTargetIdLabel');
    const input = document.getElementById('mdTargetId');
    
    if (!container || !label || !input) return;
    
    if (type === 'employee') {
        container.classList.remove('hidden');
        input.required = true;
        label.textContent = 'Employee ID';
        input.placeholder = 'e.g. EMP-01';
        
        // Auto-fill next employee ID if empty and we are not editing
        const editId = document.getElementById('mdEditId')?.value;
        if (!editId && !input.value) {
            input.value = getNextEmployeeId();
        }
    } else {
        container.classList.add('hidden');
        input.required = false; // Hide and disable required for general payee
        
        // Clear input so switching back to Employee re-calculates the ID
        const editId = document.getElementById('mdEditId')?.value;
        if (!editId) {
            input.value = '';
        }
    }
}

export async function handleMasterDataSubmit(event) {
    event.preventDefault();
    const form = event.target;
    
    const editId = form.mdEditId.value;
    
    let generatedTargetId = form.targetId.value.trim().toUpperCase();
    if (form.type.value === 'general' && !editId) {
        // Auto-generate ID from Name for new General Payees
        generatedTargetId = form.name.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    
    const payload = {
        type: form.type.value,
        targetId: generatedTargetId,
        name: form.name.value.trim(),
        department: form.department.value,
        category: form.category.value
    };
    
    try {
        const token = localStorage.getItem('authToken');
        const url = editId 
            ? `${BASE_URL}/api/master/expenses/${editId}` 
            : `${BASE_URL}/api/master/expenses`;
        const method = editId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to save record");
        }
        
        // Success - await fetch so cache updates before resetting form
        await fetchMasterData(); 
        resetMasterDataForm();
        
        // Also refresh the employee list in the add entry form if it's open
        if (window.refreshExpenseMasterDropdown) {
            window.refreshExpenseMasterDropdown();
        }
        
    } catch (err) {
        alert(err.message);
    }
}

export function resetMasterDataForm() {
    const form = document.getElementById('masterDataForm');
    if (!form) return;
    
    form.reset();
    form.mdEditId.value = '';
    form.targetId.readOnly = false;
    form.targetId.classList.remove('bg-slate-100', 'cursor-not-allowed');
    
    document.getElementById('mdSaveBtn').textContent = 'Save Record';
    document.getElementById('mdCancelBtn').classList.add('hidden');
    
    updateMasterCategories();
    updateMasterIdLabel();
}

export function editMasterRecord(id) {
    const record = MASTER_DATA_CACHE.find(r => r._id === id);
    if (!record) return;
    
    const form = document.getElementById('masterDataForm');
    form.mdEditId.value = record._id;
    form.type.value = record.type;
    form.targetId.value = record.targetId;
    form.name.value = record.name;
    
    // Make targetId readonly when editing
    form.targetId.readOnly = true;
    form.targetId.classList.add('bg-slate-100', 'cursor-not-allowed');
    
    form.department.value = record.department;
    updateMasterCategories();
    form.category.value = record.category;
    
    updateMasterIdLabel();
    
    document.getElementById('mdSaveBtn').textContent = 'Update Record';
    document.getElementById('mdCancelBtn').classList.remove('hidden');
}

export async function toggleMasterRecordStatus(id, currentStatus) {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this record?`)) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${BASE_URL}/api/master/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: !currentStatus })
        });
        
        if (res.ok) {
            fetchMasterData();
        }
    } catch (err) {
        alert("Failed to change status");
    }
}

export function filterMasterDataList() {
    const searchInput = document.getElementById('mdSearchInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        renderMasterDataList(MASTER_DATA_CACHE);
        return;
    }
    
    const filtered = MASTER_DATA_CACHE.filter(item => {
        return item.name.toLowerCase().includes(query) || 
               item.targetId.toLowerCase().includes(query) ||
               item.department.toLowerCase().includes(query) ||
               item.category.toLowerCase().includes(query);
    });
    
    renderMasterDataList(filtered);
}

function renderMasterDataList(dataList = MASTER_DATA_CACHE) {
    const tbody = document.getElementById('masterDataListBody');
    if (!tbody) return;
    
    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">No master records found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = dataList.map(item => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!item.isActive ? 'opacity-50' : ''}">
            <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${item.type === 'employee' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}">
                    ${item.type.toUpperCase()}
                </span>
            </td>
            <td class="px-4 py-3 font-mono text-sm">${item.targetId}</td>
            <td class="px-4 py-3 font-medium">${item.name}</td>
            <td class="px-4 py-3 text-sm text-slate-500">
                ${item.department} <br/> <span class="text-xs text-slate-400">${item.category}</span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
                <button onclick="editMasterRecord('${item._id}')" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded">Edit</button>
                <button onclick="toggleMasterRecordStatus('${item._id}', ${item.isActive})" class="${item.isActive ? 'text-red-600 hover:text-red-900 bg-red-50 dark:bg-red-900/30' : 'text-green-600 hover:text-green-900 bg-green-50 dark:bg-green-900/30'} dark:text-red-400 px-2 py-1 rounded">
                    ${item.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Share the EXPENSE_MAPPING logic
const EXPENSE_MAPPING = {
    "Profit": { value: "profit", categories: ["donation", "salman", "family", "customer service"] },
    "Shop Expenses": { value: "shop-expense", categories: ["recharge", "salary", "stationary", "shop", "electric", "room", "loss", "cancel", "transport", "visa"] },
    "Piece Expense": { value: "piece-expense", categories: ["stitching", "folak", "fusoos", "fusoos-purchase", "khauwar", "tola", "khaka", "computer", "magribi", "qureshi", "talli", "altor", "out-statching", "sample", "material", "jheek", "delivery", "punching"] }
};

export function populateMasterDepartments() {
    const deptSelect = document.getElementById('mdDept');
    if (!deptSelect) return;
    
    deptSelect.innerHTML = Object.entries(EXPENSE_MAPPING).map(([label, data]) => `<option value="${data.value}">${label}</option>`).join('');
    updateMasterCategories();
}

export function updateMasterCategories() {
    const deptSelect = document.getElementById('mdDept');
    const catSelect = document.getElementById('mdCat');
    if (!deptSelect || !catSelect) return;
    
    const deptValue = deptSelect.value;
    catSelect.innerHTML = '';
    
    const mappingEntry = Object.values(EXPENSE_MAPPING).find(m => m.value === deptValue);
    const categories = mappingEntry ? mappingEntry.categories : [];
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
    });
}

// Globals
window.openMasterDataModal = openMasterDataModal;
window.closeMasterDataModal = closeMasterDataModal;
window.handleMasterDataSubmit = handleMasterDataSubmit;
window.resetMasterDataForm = resetMasterDataForm;
window.editMasterRecord = editMasterRecord;
window.toggleMasterRecordStatus = toggleMasterRecordStatus;
window.updateMasterCategories = updateMasterCategories;
window.updateMasterIdLabel = updateMasterIdLabel;
window.filterMasterDataList = filterMasterDataList;
