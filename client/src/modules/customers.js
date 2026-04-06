import { state } from './state.js';
import { BASE_URL } from './config.js';
import { formatCurrency, sortArray, getSortIcon } from './utils.js';


// --- CUSTOMER DIRECTORY MODULE (V2) ---

let uniqueCustomers = [];
let filteredCustomers = []; // For search/filter results
// Local sorting state for this module
let customerSortState = { key: 'totalAmount', dir: 'desc' };

// Pagination State
let currentPage = 1;
const itemsPerPage = 20;

/**
 * Main function to aggregate and render customers.
 * Called from main navigation.
 */
export function aggregateCustomers() {
    console.log("Aggregating Customers V2...");
    const customerMap = new Map();

    const allResults = state.allResults;

    for (const [key, result] of Object.entries(allResults)) {
        // Skip summary keys and non-booking keys
        if (key.includes('|SUMMARY|')) continue;
        if (!key.endsWith('|bookings')) continue;

        const shop = key.split('|')[0];
        const bookings = result.filteredData || [];

        bookings.forEach(booking => {
            if (!booking.phone) return; // Skip if no phonenumber

            // Normalize Phone (remove spaces/dashes)
            const cleanPhone = booking.phone.replace(/\D/g, '');
            if (cleanPhone.length < 8) return;

            // Create composite key (Phone + Name) to distinguish same number diff people (unlikely but safe)
            // Actually better to just key by Phone for unique customers
            const mapKey = cleanPhone;

            if (!customerMap.has(mapKey)) {
                customerMap.set(mapKey, {
                    phone: booking.phone, // Keep original format for display
                    cleanPhone: cleanPhone,
                    name: booking.name || 'Unknown',
                    totalAmount: 0,
                    totalOrders: 0,
                    shops: new Set(),
                    lastOrderDate: null,
                    countryCode: booking.countryCode || ''
                });
            }

            const customer = customerMap.get(mapKey);
            customer.totalAmount += (booking.amount || 0);
            customer.totalOrders += 1;
            customer.shops.add(shop);

            // Track last order
            const bookingDate = new Date(booking.date);
            if (!customer.lastOrderDate || bookingDate > customer.lastOrderDate) {
                customer.lastOrderDate = bookingDate;
            }
        });
    }

    // Convert Map to Array
    uniqueCustomers = Array.from(customerMap.values()).map(c => ({
        ...c,
        shopCount: c.shops.size, // How many different shops they visited
        shopsArray: Array.from(c.shops).join(', ') // String for display
    }));

    // Initial Sort
    sortCustomers('totalAmount', 'desc');

    // Initial Filter (All)
    filteredCustomers = [...uniqueCustomers];

    renderCustomerTable();
}

/**
 * Sorts customer data
 */
function sortCustomers(key, dir = 'desc') {
    customerSortState = { key, dir };
    // Use the utility sortArray
    uniqueCustomers = sortArray(uniqueCustomers, key, dir);
}

/**
 * Handle Header Click for Sorting
 */
export function handleCustomerSort(key) {
    const currentDir = customerSortState.key === key ? customerSortState.dir : 'desc'; // Default new sort to desc
    const newDir = currentDir === 'asc' ? 'desc' : 'asc';

    sortCustomers(key, newDir);

    // Re-apply current search filter if any
    const searchVal = document.getElementById('customerSearchInput')?.value || '';
    if (searchVal) {
        filterCustomers(searchVal);
    } else {
        filteredCustomers = [...uniqueCustomers];
        currentPage = 1;
        renderCustomerTable();
    }
}


/**
 * Renders the Customer Table with Pagination
 */
export function renderCustomerTable() {
    const container = document.getElementById('dataTypeContentContainer');
    if (!container) return;

    // Pagination Logic
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageData = filteredCustomers.slice(startIndex, endIndex);

    // Sort Icons Helper
    const getIcon = (key) => {
        if (customerSortState.key !== key) return '<span class="text-slate-300 ml-1">⇅</span>';
        return customerSortState.dir === 'asc' ? '<span class="text-teal-600 ml-1">▲</span>' : '<span class="text-teal-600 ml-1">▼</span>';
    };

    let html = `
        <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Customer Directory</h2>
                    <p class="text-slate-500 text-sm mt-1">Total Unique Customers: <span class="font-bold text-teal-600">${uniqueCustomers.length}</span></p>
                </div>
                <div class="w-full md:w-96 relative">
                     <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input type="text" id="customerSearchInput" 
                        placeholder="Search name or phone..." 
                        onkeyup="filterCustomers(this.value)"
                        class="pl-10 w-full rounded-lg border-slate-300 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                    >
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="">
                    <table class="min-w-full divide-y divide-slate-200 block md:table">
                        <thead class="bg-slate-50 hidden md:table-header-group">
                            <tr>
                                <th onclick="handleCustomerSort('name')" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Name ${getIcon('name')}
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th onclick="handleCustomerSort('totalOrders')" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Orders ${getIcon('totalOrders')}
                                </th>
                                <th onclick="handleCustomerSort('totalAmount')" class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Total Spent ${getIcon('totalAmount')}
                                </th>
                                <th onclick="handleCustomerSort('shopCount')" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Shops Visited ${getIcon('shopCount')}
                                </th>
                                 <th onclick="handleCustomerSort('lastOrderDate')" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group">
                                    Last Seen ${getIcon('lastOrderDate')}
                                </th>
                                <th class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 text-[13px] block md:table-row-group">
    `;

    if (pageData.length === 0) {
        html += `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 italic">No customers found matching your search.</td></tr>`;
    } else {
        pageData.forEach(c => {
            const lastSeen = c.lastOrderDate ? c.lastOrderDate.toLocaleDateString() : '-';

            // VIP Badge Logic
            let nameHtml = `<span class="font-medium text-slate-700">${c.name}</span>`;
            if (c.totalAmount > 5000) {
                nameHtml += ` <span class="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-200 ml-1">VIP</span>`;
            }

            html += `
                <tr class="hover:bg-slate-50 transition-colors block md:table-row border-b-4 border-slate-50 md:border-none">
                    <td class="px-6 py-2.5 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block bg-slate-50/50 md:bg-transparent">
                        <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Name</span>
                        <span>${nameHtml}</span>
                    </td>
                    <td class="px-6 py-2.5 font-mono text-slate-600 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px]">
                         <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Phone</span>
                         <span>${c.countryCode} ${c.phone}</span>
                    </td>
                    <td class="px-6 py-2.5 text-center block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                        <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Orders</span>
                        <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                            ${c.totalOrders}
                        </span>
                    </td>
                    <td class="px-6 py-2.5 text-right font-bold text-emerald-700 block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block text-[13px]">
                        <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Total Spent</span>
                        <span>${formatCurrency(c.totalAmount)}</span>
                    </td>
                    <td class="px-6 py-2.5 text-center block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                        <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Shops</span>
                        <div class="tooltip" data-tip="${c.shopsArray}">
                             <span class="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 cursor-help">
                                ${c.shopCount}
                            </span>
                        </div>
                    </td>
                    <td class="px-6 py-2.5 text-slate-500 text-[11px] block md:table-cell border-b border-slate-50 md:border-none flex justify-between items-center md:block">
                        <span class="md:hidden font-black text-slate-400 uppercase text-[10px] tracking-tight">Last Seen</span>
                        <span>${lastSeen}</span>
                    </td>
                    <td class="px-6 py-4 text-center block md:table-cell md:border-none">
                        <div class="flex justify-center md:block">
                            <button onclick="viewCustomerProfile('${c.cleanPhone}')" class="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 p-2 rounded-lg transition-colors" title="View Profile">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    html += `</tbody></table></div>`;

    // Pagination Controls
    if (totalPages > 1) {
        html += `
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button onclick="changeCustomerPage(-1)" ${currentPage === 1 ? 'disabled' : ''} class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <span class="text-sm text-slate-600">Page <span class="font-bold">${currentPage}</span> of ${totalPages}</span>
                <button onclick="changeCustomerPage(1)" ${currentPage === totalPages ? 'disabled' : ''} class="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                </button>
            </div>
        `;
    }

    html += `</div></div>`; // Close card & container

    container.innerHTML = html;

    // Restore search focus
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) {
        // searchInput.focus(); // Sometimes annoying if typing fast, maybe handle differently
        // But for refactor we keep simple.
    }
}

/**
 * Filter Helper
 */
export function filterCustomers(query) {
    if (!query) {
        filteredCustomers = [...uniqueCustomers];
    } else {
        const lowerQ = query.toLowerCase();
        filteredCustomers = uniqueCustomers.filter(c =>
            c.name.toLowerCase().includes(lowerQ) ||
            c.phone.includes(query) ||
            c.cleanPhone.includes(query)
        );
    }
    currentPage = 1;
    renderCustomerTable();
    // Maintain focus logic if needed
    const input = document.getElementById('customerSearchInput');
    if (input) {
        input.value = query;
        input.focus();
    }
}

export function changeCustomerPage(delta) {
    currentPage += delta;
    renderCustomerTable();
}


/**
 * View Customer Profile (Detailed Modal)
 */
export async function viewCustomerProfile(cleanPhone) {
    // We need to fetch all orders for this customer across all shops
    // We can do this from client-side state since we have 'state.allResults' 
    // BUT 'state.allResults' might only have loaded shops. 
    // Ideally we should have a dedicated endpoint, but for now we aggregate from what we have.
    // NOTE: If a shop isn't loaded, we won't show its data. 
    // Optimization: We could trigger a load for all shops, but that's heavy.
    // Let's assume the user has browsed enough or we just show what's loaded.

    const customer = uniqueCustomers.find(c => c.cleanPhone === cleanPhone);
    if (!customer) return;

    // Aggregate Orders
    const orders = [];
    for (const [key, result] of Object.entries(state.allResults)) {
        if (!key.endsWith('|bookings')) continue;
        const shop = key.split('|')[0];

        const shopOrders = (result.filteredData || []).filter(b => b.phone && b.phone.replace(/\D/g, '') === cleanPhone);

        shopOrders.forEach(o => {
            orders.push({ ...o, shop });
        });
    }

    // Sort Orders by Date desc
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Show Modal
    const modalHtml = `
        <div class="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onclick="if(event.target === this) closeCustomerModal()">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <!-- Header -->
                <div class="bg-slate-800 text-white p-6 flex justify-between items-start">
                    <div>
                        <h3 class="text-2xl font-bold">${customer.name}</h3>
                        <p class="text-slate-400 font-mono mt-1 text-lg">${customer.countryCode} ${customer.phone}</p>
                        <div class="flex gap-2 mt-3">
                             <span class="bg-indigo-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Total Spent: ${formatCurrency(customer.totalAmount)}</span>
                             <span class="bg-slate-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Orders: ${orders.length}</span>
                        </div>
                    </div>
                    <button onclick="closeCustomerModal()" class="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <h4 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Order History</h4>
                    
                    <div class="space-y-3">
                        ${orders.map(order => `
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center hover:shadow-md transition-shadow">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">${order.shop}</span>
                                        <span class="text-sm font-bold text-slate-800">Bill #${order.billNo}</span>
                                    </div>
                                    <p class="text-xs text-slate-500">${new Date(order.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold text-teal-700">${formatCurrency(order.amount)}</p>
                                    <p class="text-xs text-slate-400">Qty: ${order.qty || '-'}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing if any
    const existing = document.getElementById('customerProfileModal');
    if (existing) existing.remove();

    const modalDiv = document.createElement('div');
    modalDiv.id = 'customerProfileModal';
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv);
}

export function closeCustomerModal() {
    const modal = document.getElementById('customerProfileModal');
    if (modal) modal.remove();
}

// Attach globals
window.aggregateCustomers = aggregateCustomers;
window.handleCustomerSort = handleCustomerSort;
window.filterCustomers = filterCustomers;
window.changeCustomerPage = changeCustomerPage;
window.viewCustomerProfile = viewCustomerProfile;
window.closeCustomerModal = closeCustomerModal;
