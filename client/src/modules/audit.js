
import { state } from './state.js';
import { SHOP_PREFIXES } from './config.js';
import { fetchEndpoint } from './api.js';
import { showLoading } from './ui.js';

// --- MISSING BILLS / AUDIT LOGIC ---

export function openMissingBillsModal() {
    const modal = document.getElementById('missingBillsModal');
    // Render shop selection checkboxes each time modal opens
    renderShopSelection();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

export function closeMissingBillsModal() {
    const modal = document.getElementById('missingBillsModal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('missingResults').innerHTML = '';
}

export function autoSetRange() {
    let min = Infinity;
    let max = -Infinity;
    let hasData = false;

    const normalize = !!document.getElementById('normalizeBill')?.checked;

    // Determine selected shops from modal checkboxes (if any are rendered)
    const selectedShopEls = Array.from(document.querySelectorAll('.shop-select-checkbox')).filter(ch => ch.checked);
    const shopsToScan = selectedShopEls.length ? selectedShopEls.map(ch => ch.value) : [...SHOP_PREFIXES];

    // Iterate selected shops to find min/max
    shopsToScan.forEach(shop => {
        const key = `${shop}|bookings`;
        const data = state.allResults[key];
        if (data && data.filteredData) {
            data.filteredData.forEach(doc => {
                const raw = tryExtractBillValue(doc);
                if (!raw) return;
                const valStr = normalize ? normalizeBillString(raw) : raw;
                if (valStr && /^\d+$/.test(valStr)) {
                    const num = parseInt(valStr, 10);
                    if (num < min) min = num;
                    if (num > max) max = num;
                    hasData = true;
                }
            });
        }
    });

    if (!hasData) {
        alert('No data available for the selected shops to calculate range. Please fetch data first.');
        return;
    }

    document.getElementById('missingStart').value = min;
    document.getElementById('missingEnd').value = max;
}

/**
 * Analyzes a map of numbers to find duplicates and missing ranges.
 * returns { missingRanges: string[], duplicates: number[], missingCount: number, duplicateCount: number }
 */
function computeGapAnalysis(numberCountsMap, start, end) {
    const duplicates = [];

    // 1. Identify Duplicates
    for (const [num, count] of numberCountsMap.entries()) {
        if (num >= start && num <= end && count > 1) {
            duplicates.push(num);
        }
    }
    duplicates.sort((a, b) => a - b);

    // 2. Identify Missing Ranges directly
    const missingRanges = [];
    let missingCount = 0;

    // We iterate from start to end, checking existence in the Map.
    const existingInRange = Array.from(numberCountsMap.keys())
        .filter(n => n >= start && n <= end)
        .sort((a, b) => a - b);

    // Edge case: No data in range
    if (existingInRange.length === 0) {
        if (end >= start) {
            const r = start === end ? `${start}` : `${start}-${end}`;
            missingRanges.push(r);
            missingCount += (end - start + 1);
        }
        return { missingRanges, duplicates, missingCount, duplicateCount: duplicates.length };
    }

    // Check gap before first number
    if (existingInRange[0] > start) {
        const gapEnd = existingInRange[0] - 1;
        const r = start === gapEnd ? `${start}` : `${start}-${gapEnd}`;
        missingRanges.push(r);
        missingCount += (gapEnd - start + 1);
    }

    // Check gaps between numbers
    for (let i = 0; i < existingInRange.length - 1; i++) {
        const currNum = existingInRange[i];
        const nextNum = existingInRange[i + 1];
        if (nextNum > currNum + 1) {
            const gapStart = currNum + 1;
            const gapEnd = nextNum - 1;
            const r = gapStart === gapEnd ? `${gapStart}` : `${gapStart}-${gapEnd}`;
            missingRanges.push(r);
            missingCount += (gapEnd - gapStart + 1);
        }
    }

    // Check gap after last number
    const lastNum = existingInRange[existingInRange.length - 1];
    if (lastNum < end) {
        const gapStart = lastNum + 1;
        const r = gapStart === end ? `${gapStart}` : `${gapStart}-${end}`;
        missingRanges.push(r);
        missingCount += (end - gapStart + 1);
    }

    return { missingRanges, duplicates, missingCount, duplicateCount: duplicates.length };
}

function tryExtractBillValue(doc) {
    // Try a set of common field names that might contain the bill number
    const candidates = ['billNo', 'bill_no', 'billno', 'billNumber', 'bill_number', 'invoiceNo', 'invoice_no', 'invoice', 'bill'];
    for (const key of candidates) {
        if (doc[key] != null) return String(doc[key]);
    }

    // Fallback: try to find any key whose value contains digits that look like an invoice/bill
    // EXCLUDE known metadata or metric fields that are definitely not bill numbers
    const ignoreKeys = new Set(['qty', 'quantity', 'amount', 'price', 'total', 'count', 'cnt', 'year', 'month', 'day', '__v', 'phone', 'mobile']);

    for (const k of Object.keys(doc)) {
        if (ignoreKeys.has(k.toLowerCase())) continue;

        const v = doc[k];
        if (v == null) continue;
        const s = String(v);

        // Heuristic: Must contain digits, max length 12
        if (/\d/.test(s) && s.length <= 12) return s;
    }
    return null;
}

function normalizeBillString(s) {
    if (s == null) return null;
    const digits = String(s).replace(/\D+/g, '');
    if (!digits) return null;
    // Remove leading zeros so '001' becomes '1' which matches numeric ranges
    return digits.replace(/^0+/, '') || '0';
}

function renderShopSelection() {
    const container = document.getElementById('shopSelectionContainer');
    if (!container) return;
    container.innerHTML = SHOP_PREFIXES.map(s => `
        <label class="inline-flex items-center space-x-2 text-sm">
            <input type="checkbox" class="shop-select-checkbox" value="${s}" checked />
            <span>${s}</span>
        </label>
    `).join('');
}

export async function scanMissingBills(e) {
    if (e) e.preventDefault();
    const start = parseInt(document.getElementById('missingStart').value || '1', 10);
    const end = parseInt(document.getElementById('missingEnd').value || '5000', 10);

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        alert('Please provide a valid numeric range where End ≥ Start and both ≥ 1.');
        return;
    }

    const resultsContainer = document.getElementById('missingResults');
    resultsContainer.innerHTML = `<p class="text-sm text-slate-500">Scanning... This uses cached results from the last "Fetch Data" call. If data is missing, please click "Fetch Data" first.</p>`;

    // Determine selected shops from modal checkboxes
    const selectedShopEls = Array.from(document.querySelectorAll('.shop-select-checkbox')).filter(ch => ch.checked);
    const selectedShops = selectedShopEls.length ? selectedShopEls.map(ch => ch.value) : [...SHOP_PREFIXES];

    const normalize = !!document.getElementById('normalizeBill')?.checked;

    // Build results per selected shop
    const shopResults = {};
    selectedShops.forEach(shop => {
        const key = `${shop}|bookings`;
        const bookingData = state.allResults[key];

        // Use a generic logic to collect numbers: Map<number, count>
        const numberCounts = new Map();
        let hasData = false;
        let errorMessage = bookingData?.errorMessage || null;

        if (bookingData && Array.isArray(bookingData.filteredData)) {
            hasData = true;
            bookingData.filteredData.forEach(doc => {
                let raw = tryExtractBillValue(doc);
                if (raw == null) return;
                raw = raw.trim();
                const valStr = normalize ? normalizeBillString(raw) : raw;
                if (valStr && /^\d+$/.test(valStr)) {
                    const num = parseInt(valStr, 10);
                    numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
                }
            });
        }

        if (!hasData) {
            shopResults[shop] = { hasData: false, error: errorMessage };
            return;
        }

        const analysis = computeGapAnalysis(numberCounts, start, end);
        shopResults[shop] = { hasData: true, ...analysis };
    });

    // Render results
    let html = '<div class="space-y-4">';
    const onlyMissing = document.getElementById('onlyMissing')?.checked;

    Object.keys(shopResults).forEach(shop => {
        const r = shopResults[shop];
        // 'Hide OK' logic: if checked, hide shops with 0 missing AND 0 duplicates
        const isPerfect = r.hasData && r.missingCount === 0 && r.duplicateCount === 0;
        if (onlyMissing && isPerfect) return;

        html += `
            <div class="p-4 border rounded-lg bg-slate-50 relative">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-3">
                        <h4 class="font-bold text-slate-800 text-lg">${shop}</h4>
                        ${!r.hasData ? '' : `
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${r.missingCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                                Missing: ${r.missingCount}
                            </span>
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${r.duplicateCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}">
                                Duplicates: ${r.duplicateCount}
                            </span>
                        `}
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="text-xs px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50" onclick='copyMissing(${JSON.stringify(shop)}, ${start}, ${end})'>Copy Report</button>
                    </div>
                </div>
        `;

        if (!r.hasData) {
            html += `<p class="text-sm text-amber-700">No booking data fetched. <button class="underline font-medium" onclick="fetchSingleShop('${shop}')">Fetch now</button></p>`;
        } else if (isPerfect) {
            html += '<p class="text-sm text-green-700 font-medium flex items-center"><svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Perfect! No missing numbers or duplicates in range.</p>';
        } else {
            // Render Missing
            if (r.missingCount > 0) {
                html += `
                    <div class="mb-2">
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Missing Ranges</p>
                        <p class="text-sm font-mono text-red-700 bg-red-50 p-2 rounded border border-red-100 break-words whitespace-pre-wrap leading-relaxed">${r.missingRanges.join(', ')}</p>
                    </div>
                `;
            }
            // Render Duplicates
            if (r.duplicateCount > 0) {
                html += `
                    <div>
                        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duplicate Bills</p>
                        <p class="text-sm font-mono text-amber-700 bg-amber-50 p-2 rounded border border-amber-100 break-words">${r.duplicates.join(', ')}</p>
                    </div>
                `;
            }
        }
        html += `</div>`;
    });
    html += '</div>';

    resultsContainer.innerHTML = html;
}

export function downloadMissing(shop, start, end) {
    const key = `${shop}|bookings`;
    const bookingData = state.allResults[key];
    const normalize = !!document.getElementById('normalizeBill')?.checked;

    const numberCounts = createNumberCountsMap(bookingData ? bookingData.filteredData : [], normalize);
    const missing = computeGapAnalysis(numberCounts, start, end).missingRanges;

    const blob = new Blob([missing.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${shop}_missing_bills_${start}_to_${end}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Helper to create the map for gap analysis reused in multiple places
function createNumberCountsMap(filteredData, normalize) {
    const numberCounts = new Map();
    if (!filteredData) return numberCounts;
    filteredData.forEach(doc => {
        let raw = tryExtractBillValue(doc);
        if (raw == null) return;
        raw = raw.trim();
        const valStr = normalize ? normalizeBillString(raw) : raw;
        if (valStr && /^\d+$/.test(valStr)) {
            const num = parseInt(valStr, 10);
            numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
        }
    });
    return numberCounts;
}

export function copyMissing(shop, start, end) {
    const key = `${shop}|bookings`;
    const bookingData = state.allResults[key];
    const normalize = !!document.getElementById('normalizeBill')?.checked;

    const numberCounts = createNumberCountsMap(bookingData ? bookingData.filteredData : [], normalize);
    const { missingRanges, duplicates } = computeGapAnalysis(numberCounts, start, end);

    let text = `Shop: ${shop}\nRange: ${start}-${end}\n`;
    text += `Missing: ${missingRanges.length > 0 ? missingRanges.join(', ') : 'None'}\n`;
    text += `Duplicates: ${duplicates.length > 0 ? duplicates.join(', ') : 'None'}`;

    if (!navigator.clipboard) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Copied to clipboard');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        alert('Report copied to clipboard');
    }).catch(err => {
        console.error('Clipboard error', err);
        alert('Copy failed');
    });
}

export async function fetchSingleShop(shop) {
    try {
        showLoading(true);
        // Fetch only bookings for this shop and update cache
        await fetchEndpoint(shop, 'bookings', state.dateRange.start, state.dateRange.end);
        // After fetching, re-scan to update the results
        scanMissingBills();
    } catch (err) {
        console.error('Error fetching single shop bookings', err);
        alert('Failed to fetch bookings for ' + shop);
    } finally {
        showLoading(false);
    }
}

export function downloadAllMissingCSV() {
    const start = parseInt(document.getElementById('missingStart').value || '1', 10);
    const end = parseInt(document.getElementById('missingEnd').value || '5000', 10);
    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        alert('Please provide a valid numeric range where End ≥ Start and both ≥ 1.');
        return;
    }

    // Build CSV rows: Shop,MissingCount,DuplicateCount,MissingRanges,DuplicateList
    const rows = [['Shop', 'MissingCount', 'DuplicateCount', 'MissingRanges', 'DuplicateList']];

    // Use selected shops
    const selectedShopEls = Array.from(document.querySelectorAll('.shop-select-checkbox')).filter(ch => ch.checked);
    const selectedShops = selectedShopEls.length ? selectedShopEls.map(ch => ch.value) : [...SHOP_PREFIXES];

    const normalize = !!document.getElementById('normalizeBill')?.checked;

    selectedShops.forEach(shop => {
        const key = `${shop}|bookings`;
        const bookingData = state.allResults[key];

        if (!(bookingData && Array.isArray(bookingData.filteredData))) {
            return;
        }

        const numberCounts = createNumberCountsMap(bookingData.filteredData, normalize);
        const { missingRanges, duplicates, missingCount, duplicateCount } = computeGapAnalysis(numberCounts, start, end);

        // Escape quotes for CSV
        const missingStr = `"${missingRanges.join(', ')}"`;
        const duplicatesStr = `"${duplicates.join(', ')}"`;

        rows.push([shop, String(missingCount), String(duplicateCount), missingStr, duplicatesStr]);
    });

    if (rows.length === 1) {
        alert('No booking data available for selected shops. Fetch data first.');
        return;
    }

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `detailed_missing_bills_${start}_to_${end}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// Global Attachments for HTML Access
window.openMissingBillsModal = openMissingBillsModal;
window.closeMissingBillsModal = closeMissingBillsModal;
window.autoSetRange = autoSetRange;
window.scanMissingBills = scanMissingBills;
window.downloadAllMissingCSV = downloadAllMissingCSV;
window.copyMissing = copyMissing;
window.downloadMissing = downloadMissing;
window.fetchSingleShop = fetchSingleShop;
window.shopSelectionContainer = renderShopSelection; // Or just ensure it runs on modal open (it does)
