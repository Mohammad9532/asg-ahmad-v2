// --- EXCEL EXPORT LOGIC ---

/**
 * Downloads a comprehensive monthly Excel report.
 * @param {string} shop 
 * @param {string} [monthYearStr] Optional 'YYYY-MM' to specify month. Defaults to start date month.
 */
function downloadMonthlyExcel(shop, monthYearStr) {
    const bk = allResults[`${shop}|bookings`];
    const exp = allResults[`${shop}|expense`];
    const del = allResults[`${shop}|delivery`];

    const errorMessage = "Please ensure all data (Bookings, Expenses, Deliveries) is fetched for this shop and try again.";
    if (!bk || !exp || !del) { alert(errorMessage); return; }

    let targetMonth, targetYear, monthName;

    if (monthYearStr) {
        const parts = monthYearStr.split('-');
        targetYear = parseInt(parts[0], 10);
        targetMonth = parseInt(parts[1], 10) - 1; // 0-indexed
        monthName = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long' });
    } else {
        const startDate = new Date(document.getElementById('startDate').value);
        targetMonth = startDate.getMonth();
        targetYear = startDate.getFullYear();
        monthName = startDate.toLocaleString('default', { month: 'long' });
    }

    // 1. Identify all unique delivery categories for this month
    const categoriesSet = new Set();
    if (del.filteredData) {
        del.filteredData.forEach(doc => {
            const date = new Date(doc.date);
            if (date.getMonth() === targetMonth && date.getFullYear() === targetYear) {
                const bNo = (doc.billNo || '').toLowerCase().trim();
                let type = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

                if (type.includes('CARD') || type.includes('VISA') || type.includes('MASTER')) type = 'ADIB';
                if (type !== 'ADIB' && type !== 'ATM') type = 'CASH';
                categoriesSet.add(type);
            }
        });
    }

    const deliveryCategories = ['CASH', 'ADIB', 'ATM'];

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const monthDataMap = new Map();

    for (let i = 1; i <= daysInMonth; i++) {
        const dayObj = {
            date: `${i}/${targetMonth + 1}/${targetYear}`,
            booking: 0,
            deliveryBreakdown: {},
            totalDelivery: 0,
            expense: 0,
            cancelled: 0,
            salman: 0
        };
        deliveryCategories.forEach(cat => dayObj.deliveryBreakdown[cat] = 0);
        monthDataMap.set(i, dayObj);
    }

    const processData = (list, type) => {
        if (!list || !list.filteredData) return;
        list.filteredData.forEach(doc => {
            const date = new Date(doc.date);
            if (date.getMonth() !== targetMonth || date.getFullYear() !== targetYear) return;

            const day = date.getDate();
            const dayObj = monthDataMap.get(day);
            const amt = doc.amount || 0;

            if (type === 'booking') {
                if (isCanceledStatus(doc.status)) {
                    dayObj.cancelled += amt;
                } else {
                    dayObj.booking += amt;
                }
            } else if (type === 'expense') {
                dayObj.expense += amt;
            } else if (type === 'delivery') {
                const bNo = (doc.billNo || '').toLowerCase().trim();
                let pType = doc.amountType ? doc.amountType.toUpperCase().trim() : 'CASH';

                if (pType.includes('CARD') || pType.includes('VISA') || pType.includes('MASTER')) pType = 'ADIB';
                if (pType !== 'ADIB' && pType !== 'ATM') pType = 'CASH';

                if (dayObj.deliveryBreakdown.hasOwnProperty(pType)) {
                    dayObj.deliveryBreakdown[pType] += amt;
                    dayObj.totalDelivery += amt;
                }
            }
        });
    };

    processData(bk, 'booking');
    processData(exp, 'expense');
    processData(del, 'delivery');

    // Prepare Excel Headers
    const headers = ['Date', 'Booking'];
    deliveryCategories.forEach(cat => headers.push(`${cat} Delivery`));
    headers.push('Total Delivery', 'Expense', 'Cancelled', 'Salman Bhai');

    const dataRows = [headers];
    const sortedDays = Array.from(monthDataMap.keys()).sort((a, b) => a - b);

    let totalBookingMonthly = 0, totalCancelMonthly = 0, totalExpMonthly = 0;
    let totalBookingDelMonthly = 0, totalMiscDelMonthly = 0;
    const grandTotalsBreakdown = {};
    deliveryCategories.forEach(cat => grandTotalsBreakdown[cat] = 0);

    sortedDays.forEach(day => {
        const d = monthDataMap.get(day);
        const row = [d.date, d.booking];

        let dayBookingDel = 0;
        let dayMiscDel = 0;

        deliveryCategories.forEach(cat => {
            const val = d.deliveryBreakdown[cat] || 0;
            row.push(val);
            grandTotalsBreakdown[cat] += val;

            // We need to know if this category belongs to booking or misc
            // This is slightly tricky here because we already aggregated by category.
            // Let's re-calculate monthly totals more simply by iterating deliveries again or tracking in processData.
        });
        row.push(d.totalDelivery, d.expense, d.cancelled, 0);
        dataRows.push(row);

        totalBookingMonthly += d.booking;
        totalCancelMonthly += d.cancelled;
        totalExpMonthly += d.expense;
    });

    // Let's recalculate the side panel totals accurately by looking at the raw delivery data again
    if (del.filteredData) {
        del.filteredData.forEach(doc => {
            const date = new Date(doc.date);
            if (date.getMonth() === targetMonth && date.getFullYear() === targetYear) {
                const amt = doc.amount || 0;
                const bNo = (doc.billNo || '').toLowerCase().trim();
                if (bNo && bNo !== 'other-amounts') {
                    totalBookingDelMonthly += amt;
                } else {
                    totalMiscDelMonthly += amt;
                }
            }
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(dataRows);

    // SIDE PANEL TOTALS
    const colCount = headers.length;
    const startRow = 1;
    const C_LABEL = colCount + 1;
    const C_VAL = colCount + 2;

    const setCell = (r, c, val) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        ws[ref] = { t: typeof val === 'number' ? 'n' : 's', v: val };
    };

    setCell(startRow, C_VAL, "Month Total");
    let r = startRow + 2;
    setCell(r, C_LABEL, "Booking"); setCell(r, C_VAL, totalBookingMonthly); r++;
    setCell(r, C_LABEL, "Cancelled"); setCell(r, C_VAL, totalCancelMonthly); r++;
    setCell(r, C_LABEL, "Net Booking"); setCell(r, C_VAL, totalBookingMonthly - totalCancelMonthly); r++;

    // Individual delivery category totals
    deliveryCategories.forEach(cat => {
        setCell(r, C_LABEL, `${cat} Delivery`);
        setCell(r, C_VAL, grandTotalsBreakdown[cat]);
        r++;
    });

    setCell(r, C_LABEL, "Booking Delivery"); setCell(r, C_VAL, totalBookingDelMonthly); r++;
    setCell(r, C_LABEL, "Misc Collections"); setCell(r, C_VAL, totalMiscDelMonthly); r++;
    setCell(r, C_LABEL, "Total Delivery"); setCell(r, C_VAL, totalBookingDelMonthly + totalMiscDelMonthly); r++;

    setCell(r, C_LABEL, "Expense"); setCell(r, C_VAL, totalExpMonthly); r++;

    const balance = (totalBookingMonthly - totalCancelMonthly) - (totalBookingDelMonthly + totalMiscDelMonthly);
    setCell(r, C_LABEL, "Balance"); setCell(r, C_VAL, balance);

    // Auto-width
    const wscols = [];
    for (let i = 0; i < C_VAL + 1; i++) wscols.push({ wch: 15 });
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} Report`);
    XLSX.writeFile(wb, `${shop}_${monthName}_${targetYear}_Report.xlsx`);
}

// Alias for button click
function exportMonthlySummaryToCSV(shop) {
    downloadMonthlyExcel(shop);
}
