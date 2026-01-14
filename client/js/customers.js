/**
 * CUSTOMER DIRECTORY MODULE (V2)
 * Features: Unified View, Analytics, Pagination, Profile Modal, Export.
 */

let uniqueCustomers = [];
let filteredCustomers = []; // For search/filter results
let customerSortState = { key: 'totalAmount', dir: 'desc' };

// Pagination State
let currentPage = 1;
const itemsPerPage = 20; // User Request: Limit to 20

function aggregateCustomers() {
    console.log("Aggregating Customers V2...");
    const customerMap = new Map();

    for (const [key, result] of Object.entries(allResults)) {
        if (!key.endsWith('|bookings')) continue;
        const shopName = key.split('|')[0];
        const entries = Array.isArray(result) ? result : (result.filteredData || []);

        if (!Array.isArray(entries)) continue;

        entries.forEach(entry => {
            const rawName = entry.customerName || entry.name;
            if (!rawName) return;

            const mobileMatch = rawName.match(/[\d\-\+\(\)\s]{8,}/);
            const mobile = (entry.phone || (mobileMatch ? mobileMatch[0].replace(/\D/g, '') : '')).trim();
            const cleanName = rawName.replace(/[\d\-\+\(\)\s]{8,}/, '').trim() || rawName.trim();

            const uniqueKey = mobile ? `mobile:${mobile}` : `name:${cleanName.toLowerCase()}`;

            if (!customerMap.has(uniqueKey)) {
                customerMap.set(uniqueKey, {
                    key: uniqueKey, // for modal lookup
                    name: cleanName,
                    mobile: mobile,
                    shops: new Set(),
                    totalAmount: 0,
                    bookingsCount: 0,
                    lastSeen: entry.date,
                    entries: [] // Store full history
                });
            }

            const profile = customerMap.get(uniqueKey);
            profile.shops.add(shopName);
            profile.totalAmount += (parseFloat(entry.amount) || 0);
            profile.bookingsCount++;
            if (entry.date > profile.lastSeen) profile.lastSeen = entry.date;

            // Add to history
            profile.entries.push({
                date: entry.date,
                shop: shopName,
                amount: parseFloat(entry.amount) || 0,
                details: entry.remarks || entry.description || '-'
            });
        });
    }

    uniqueCustomers = Array.from(customerMap.values()).map(c => ({
        ...c,
        shopCount: c.shops.size,
        shopsList: Array.from(c.shops).join(', ')
    }));

    // Sort history for each customer
    uniqueCustomers.forEach(c => c.entries.sort((a, b) => b.date.localeCompare(a.date)));

    filteredCustomers = [...uniqueCustomers]; // Init filtered list
    console.log(`Aggregation complete. ${uniqueCustomers.length} customers.`);
}

function renderCustomerDirectory() {
    const container = document.getElementById('dataTypeContentContainer');

    // Calculate Top Stats
    const totalCustomers = uniqueCustomers.length;
    const totalRevenue = uniqueCustomers.reduce((sum, c) => sum + c.totalAmount, 0);
    const topSpender = uniqueCustomers.reduce((max, c) => c.totalAmount > max.totalAmount ? c : max, uniqueCustomers[0]);
    const avgTicket = totalCustomers ? totalRevenue / uniqueCustomers.reduce((sum, c) => sum + c.bookingsCount, 0) : 0;

    container.innerHTML = `
        <!-- Header & Analytics -->
        <div class="mb-8 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Customer Directory 👥</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Unified view across all shops</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="showLongPendingView()" class="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold shadow-sm hover:bg-red-100 transition-colors">
                        ⚠️ Running Late
                    </button>
                    <button onclick="exportCustomersToCSV()" class="flex items-center px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        📥 Export CSV
                    </button>
                    <!-- Search -->
                    <div class="relative">
                        <input type="text" placeholder="Search customers..." 
                            onkeyup="filterCustomers(this.value)"
                            class="pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 w-64">
                        <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Revenue</p>
                    <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${formatCurrency(totalRevenue)}</p>
                </div>
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <p class="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Unique Customers</p>
                     <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">${totalCustomers.toLocaleString()}</p>
                </div>
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <p class="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Avg Booking</p>
                     <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">${formatCurrency(avgTicket)}</p>
                </div>
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <p class="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Top Spender</p>
                     <p class="text-sm font-bold text-slate-800 dark:text-white mt-1 truncate" title="${topSpender?.name}">${topSpender?.name || '-'}</p>
                     <p class="text-xs text-emerald-500 font-medium">${formatCurrency(topSpender?.totalAmount || 0)}</p>
                </div>
            </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                            <th class="p-4">Customer Name</th>
                            <th class="p-4 cursor-pointer hover:text-indigo-600" onclick="sortCustomers('mobile')">Contact</th>
                            <th class="p-4 cursor-pointer hover:text-indigo-600" onclick="sortCustomers('totalAmount')">Total Revenue</th>
                            <th class="p-4 cursor-pointer hover:text-indigo-600 text-center" onclick="sortCustomers('shopCount')">Shops</th>
                            <th class="p-4">Last Seen</th>
                            <th class="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="customerTableBody" class="text-sm text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-700">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination Controls -->
            <div id="paginationControls" class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <!-- Populated by JS -->
            </div>
        </div>
    `;

    renderCustomerTablePage();
}

function renderCustomerTablePage() {
    const tbody = document.getElementById('customerTableBody');
    const pagination = document.getElementById('paginationControls');

    if (!filteredCustomers.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-slate-400">No customers found.</td></tr>';
        pagination.innerHTML = '';
        return;
    }

    // Sort
    filteredCustomers.sort((a, b) => {
        const valA = a[customerSortState.key];
        const valB = b[customerSortState.key];
        return customerSortState.dir === 'asc' ? valA - valB : valB - valA;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredCustomers.slice(start, end);

    tbody.innerHTML = pageData.map(c => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
            <td class="p-4 font-medium text-slate-900 dark:text-white">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                        ${c.name.charAt(0).toUpperCase()}
                    </div>
                    ${c.name}
                </div>
            </td>
            <td class="p-4 font-mono text-xs text-slate-500">
                ${c.mobile || '<span class="opacity-30">-</span>'}
            </td>
            <td class="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                ${formatCurrency(c.totalAmount)}
                <div class="text-[10px] text-slate-400 font-normal">${c.bookingsCount} visits</div>
            </td>
             <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                    ${c.shopCount}
                </span>
            </td>
            <td class="p-4 text-slate-500 text-xs">
                ${new Date(c.lastSeen).toLocaleDateString()}
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    ${c.mobile ? `
                    <a href="https://wa.me/${c.mobile}" target="_blank" class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Chat on WhatsApp">
                        💬
                    </a>` : ''}
                    <button onclick="viewCustomerProfile('${c.key.replace(/'/g, "\\'")}')" class="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-lg transition-colors text-xs font-bold">
                        View History
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Render Pagination
    pagination.innerHTML = `
        <span class="text-sm text-slate-500">
            Showing <span class="font-medium">${start + 1}</span> to <span class="font-medium">${Math.min(end, filteredCustomers.length)}</span> of <span class="font-medium">${filteredCustomers.length}</span> entries
        </span>
        <div class="flex gap-2">
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white">Previous</button>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white">Next</button>
        </div>
    `;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCustomerTablePage();
}

function sortCustomers(key) {
    if (customerSortState.key === key) {
        customerSortState.dir = customerSortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        customerSortState.key = key;
        customerSortState.dir = 'desc';
    }
    renderCustomerTablePage();
}

function filterCustomers(query) {
    const term = query.toLowerCase();
    filteredCustomers = uniqueCustomers.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.mobile.includes(term)
    );
    currentPage = 1;
    renderCustomerTablePage();
}

// --- MODAL LOGIC ---
function viewCustomerProfile(key) {
    const profile = uniqueCustomers.find(c => c.key === key);
    if (!profile) return;

    // Populate Modal
    document.getElementById('modalCustomerName').textContent = profile.name;
    document.getElementById('modalTotalSpent').textContent = formatCurrency(profile.totalAmount);
    document.getElementById('modalTotalVisits').textContent = profile.bookingsCount;
    document.getElementById('modalMobile').textContent = profile.mobile || 'No Mobile';

    // Actions
    const actionsDiv = document.getElementById('modalActions');
    if (profile.mobile) {
        actionsDiv.innerHTML = `<a href="https://wa.me/${profile.mobile}" target="_blank" class="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-bold">Start WhatsApp Chat ↗</a>`;
    } else {
        actionsDiv.innerHTML = '';
    }

    // History Table
    const tbody = document.getElementById('modalHistoryBody');
    tbody.innerHTML = profile.entries.map(e => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="p-3 whitespace-nowrap text-slate-600 dark:text-slate-300">${new Date(e.date).toLocaleDateString()}</td>
            <td class="p-3 font-medium text-slate-800 dark:text-slate-200">${e.shop}</td>
            <td class="p-3 text-slate-500 text-xs truncate max-w-xs">${e.details}</td>
            <td class="p-3 text-right font-bold text-slate-700 dark:text-slate-300">${formatCurrency(e.amount)}</td>
        </tr>
    `).join('');

    // Show Modal
    document.getElementById('customerProfileModal').classList.remove('hidden');
}

function closeCustomerModal() {
    document.getElementById('customerProfileModal').classList.add('hidden');
}

// --- EXPORT LOGIC ---
function exportCustomersToCSV() {
    const headers = ['Name', 'Mobile', 'Total Revenue', 'Total Visits', 'Shops Visited', 'Last Seen'];
    const rows = filteredCustomers.map(c => [
        `"${c.name}"`,
        `"${c.mobile}"`,
        c.totalAmount.toFixed(2),
        c.bookingsCount,
        `"${c.shopsList}"`,
        c.lastSeen
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "customer_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- LONG PENDING ANALYSIS (User Request) ---
async function showLongPendingView() {
    const container = document.getElementById('dataTypeContentContainer');
    container.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-red-600 dark:text-red-400">⚠️ Long Pending Items (>6 Months)</h2>
                    <p class="text-sm text-slate-500 dark:text-slate-400">High value balance (>100 AED) waiting for delivery.</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="copyLongPendingMobiles()" class="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow hover:bg-emerald-700 transition-colors">
                        📱 Copy All Mobile Numbers
                    </button>
                     <button onclick="renderCustomerDirectory()" class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Back to Directory
                    </button>
                </div>
            </div>

            <div id="pendingAnalysisContent" class="flex-1 overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-center">
                <div class="flex flex-col items-center animate-pulse">
                    <div class="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4 animate-spin"></div>
                    <p class="text-slate-500 font-medium">Scanning all shops for aged stock...</p>
                </div>
            </div>
        </div>
    `;

    // 1. Fetch Data
    const agedItems = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
        const shops = new Set();
        Object.keys(allResults).forEach(k => shops.add(k.split('|')[0]));

        for (const shop of shops) {
            try {
                // 'pending' status calculates balance > 0 (Booking - Delivery)
                const pendingData = await fetchStockAuditData(shop, 'pending');

                pendingData.forEach(item => {
                    const itemDate = new Date(item.date);
                    // Use 'balance' property from API
                    const balance = parseFloat(item.balance) || 0;

                    // Filter Logic: Age > 6 months AND Balance > 100
                    if (itemDate < sixMonthsAgo && balance > 100) {
                        agedItems.push({
                            ...item,
                            shop: shop,
                            amount: balance, // Map balance to amount for display
                            ageDays: Math.floor((new Date() - itemDate) / (1000 * 60 * 60 * 24))
                        });
                    }
                });
            } catch (e) {
                console.error(`Failed to audit ${shop}`, e);
            }
        }

        renderPendingAnalysisTable(agedItems);

    } catch (err) {
        document.getElementById('pendingAnalysisContent').innerHTML = `
            <div class="text-red-500 font-bold">Error analyzing data: ${err.message}</div>
        `;
    }
}

let cachedAgedItems = [];

function renderPendingAnalysisTable(items) {
    cachedAgedItems = items;
    const container = document.getElementById('pendingAnalysisContent');

    // Sort by Age (Oldest first)
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (items.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-500 py-12">
                <p class="text-xl font-bold mb-2">Build Clear! 🎉</p>
                <p>No customers found with Balance > 100 AED pending for > 6 months.</p>
            </div>
        `;
        return;
    }

    container.className = "flex-1 overflow-y-auto custom-scroll bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700";
    container.innerHTML = `
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 block border-b border-orange-100 dark:border-orange-800 mb-4">
            <p class="text-orange-800 dark:text-orange-200 text-sm font-bold">
                Found ${items.length} items older than 6 months (Total Pending Balance: ${formatCurrency(items.reduce((s, i) => s + parseFloat(i.amount), 0))})
            </p>
        </div>
        <table class="w-full text-left text-sm border-collapse">
            <thead class="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                <tr class="text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th class="p-4">Date (Age)</th>
                    <th class="p-4">Bill No</th>
                    <th class="p-4">Customer</th>
                    <th class="p-4">Mobile</th>
                    <th class="p-4">Shop</th>
                    <th class="p-4">Details</th>
                    <th class="p-4 text-right">Balance</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                ${items.map(item => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td class="p-4 whitespace-nowrap">
                            <div class="font-medium text-slate-800 dark:text-white">${new Date(item.date).toLocaleDateString()}</div>
                            <div class="text-xs text-red-500 font-bold">${item.ageDays} days ago</div>
                        </td>
                        <td class="p-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            ${item.billNo || '-'}
                        </td>
                         <td class="p-4 font-medium text-slate-900 dark:text-white">
                            ${item.customerName || item.name}
                        </td>
                        <td class="p-4 font-mono text-xs text-slate-500">
                            ${extractMobile(item)}
                        </td>
                        <td class="p-4 text-xs text-slate-600 dark:text-slate-300">
                            ${item.shop}
                        </td>
                        <td class="p-4 text-slate-500 text-xs max-w-xs truncate">
                            ${item.remarks || '-'}
                        </td>
                        <td class="p-4 text-right font-bold text-red-600 dark:text-red-400">
                            ${formatCurrency(item.amount)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Helper to normalize to Gulf formats
function normalizeMobile(num, countryCodeFromDB) {
    let clean = num.replace(/\D/g, ''); // Remove non-digits

    // 1. If DB has Country Code, use it!
    if (countryCodeFromDB) {
        let code = countryCodeFromDB.replace(/\D/g, '');
        // Remove leading 0 from number if appending to code
        if (clean.startsWith('0')) clean = clean.substring(1);

        // Ensure we don't double add (e.g. code=971, num=97150...)
        if (clean.startsWith(code)) return clean;
        return code + clean;
    }

    // 2. Auto-Detect / Default Rules (Gulf)

    // Already has Gulf Code?
    const gulfCodes = ['971', '966', '965', '968', '973', '974'];
    if (gulfCodes.some(c => clean.startsWith(c) && clean.length > 7)) {
        return clean;
    }

    // usage of 05x is shared between UAE and KSA (both 10 digits).
    // Unique KSA Prefixes: 051, 053, 057, 059
    if ((clean.startsWith('051') || clean.startsWith('053') || clean.startsWith('057') || clean.startsWith('059')) && clean.length === 10) {
        return '966' + clean.substring(1);
    }
    // Unique KSA (without leading 0)
    if ((clean.startsWith('51') || clean.startsWith('53') || clean.startsWith('57') || clean.startsWith('59')) && clean.length === 9) {
        return '966' + clean;
    }

    // Heuristics for "Local" numbers (Default to UAE for shared 05x)
    // UAE (05x - 10 digits) -> 971
    if ((clean.startsWith('05') && clean.length === 10) || (clean.startsWith('5') && clean.length === 9)) {
        return '971' + (clean.startsWith('0') ? clean.substring(1) : clean);
    }

    // Kuwait (Start 5, 6, 9 - 8 digits) -> 965
    if ((clean.startsWith('5') || clean.startsWith('6') || clean.startsWith('9')) && clean.length === 8) {
        return '965' + clean;
    }

    // Bahrain (Start 3, 6 - 8 digits) -> 973
    if ((clean.startsWith('3') || clean.startsWith('6')) && clean.length === 8) {
        return '973' + clean;
    }

    // Qatar (Start 3, 5, 6, 7 - 8 digits) -> 974
    // Note: Overlaps with Kuwait (5, 6) and Bahrain (3, 6).
    // Logic priority needed. Kuwait (5,6,9), Bahrain (3,6), Qatar (3,5,6,7). 
    // This is messy without Country Code. 
    // Let's rely on Country Code for perfect accuracy. 
    // For now, specific blocks:

    // Oman (Start 7, 9 - 8 digits) -> 968
    if ((clean.startsWith('7') || clean.startsWith('9')) && clean.length === 8) {
        return '968' + clean;
    }

    // KSA (Starts with 5 - 9 digits? No, usually 05x is 10 digits).
    // If we see 9 digits starting with 5, it could be UAE (50...) or KSA (50...).
    // Default to UAE (971) as per business logic, but acknowledge KSA exists.

    if ((clean.startsWith('3') || clean.startsWith('5') || clean.startsWith('6') || clean.startsWith('7')) && clean.length === 8) {
        // Fallback bucket for 8-digit Gulf numbers if not caught above
        // 3xxxxxxx -> Bahrain?
        // 5xxxxxxx -> Kuwait?
        // 6xxxxxxx -> Kuwait/Bahrain?
        // 7xxxxxxx -> Qatar?
        if (clean.startsWith('3')) return '973' + clean; // Bahrain
        if (clean.startsWith('5')) return '965' + clean; // Kuwait
        if (clean.startsWith('6')) return '965' + clean; // Kuwait
        if (clean.startsWith('7')) return '974' + clean; // Qatar
        return '974' + clean; // Default Qatar for others?
    }

    // Fallback: If 9+ digits, return as is (might be intl)
    if (clean.length >= 9) return clean;

    return null;
}

function extractMobile(item) {
    let raw = null;
    let cc = item.countryCode || null;

    // 1. Explicit phone field
    if (item.phone) raw = item.phone;

    // 2. Fallback to Name/Remarks
    if (!raw) {
        const text = ((item.customerName || item.name || "") + " " + (item.remarks || "")).toLowerCase();
        const match = text.match(/[\d\-\+\(\)\s]{9,}/); // Look for at least 9 digit-like chars
        if (match) raw = match[0];
    }

    if (raw) {
        const normalized = normalizeMobile(raw);
        if (normalized) return normalized;
    }

    return '-';
}

function copyLongPendingMobiles() {
    const mobiles = new Set();

    // Counter for invalid vs valid
    let validCount = 0;

    cachedAgedItems.forEach(item => {
        const m = extractMobile(item);
        if (m !== '-') {
            mobiles.add(m);
            validCount++;
        }
    });

    if (mobiles.size === 0) {
        alert(`No valid mobile numbers found in these ${cachedAgedItems.length} items.`);
        return;
    }

    const text = Array.from(mobiles).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        alert(`Copied ${mobiles.size} unique numbers (with 971 code) to clipboard!`);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Failed to copy. Check console.");
    });
}
