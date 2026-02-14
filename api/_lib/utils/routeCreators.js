const mongoose = require('mongoose');
const { createAggregationPipeline } = require('./helpers');
const { LedgerSettings, LedgerAdjustment } = require('../models/Ledger');

/**
 * Creates the Create Entry Route (POST).
 */
const createEntryRoute = (Model, type) => async (req, res) => {
    try {
        const entryData = req.body;
        if (!entryData.date || entryData.amount === undefined) {
            return res.status(400).json({ error: "Date and Amount are required." });
        }

        if (type === 'bookings' && entryData.billNo && entryData.billNo !== 'other-amounts') {
            const billNoTrimmed = String(entryData.billNo).trim();
            const existingEntry = await Model.findOne({ billNo: billNoTrimmed });
            if (existingEntry) {
                return res.status(400).json({ error: `Duplicate Bill No: ${billNoTrimmed} already exists for this shop.` });
            }
        }

        let sanitisedObject = {};
        const { billNo, amount, date, amountType, dept, cat, name, noOfUpdates, ...rest } = entryData;

        if (type === 'expense') {
            sanitisedObject = {
                amount: amount !== undefined ? Number(amount) : undefined,
                date: new Date(date),
                dept: dept ? String(dept).toLowerCase() : undefined,
                cat: cat ? String(cat).toLowerCase() : undefined,
                name: name ? String(name).toLowerCase() : undefined,
                noOfUpdates: noOfUpdates !== undefined ? Number(noOfUpdates) : 0,
                ...rest
            };
        } else if (type === 'bookings') {
            const { countryCode, phone, qty, status } = entryData;
            sanitisedObject = {
                billNo: billNo ? String(billNo).trim() : undefined,
                name: name ? String(name) : undefined,
                date: new Date(date),
                countryCode: countryCode ? String(countryCode) : undefined,
                phone: phone ? String(phone) : undefined,
                qty: qty !== undefined ? Number(qty) : undefined,
                amount: amount !== undefined ? Number(amount) : undefined,
                noOfUpdates: noOfUpdates !== undefined ? Number(noOfUpdates) : 0,
                status: status ? String(status).toLowerCase() : undefined,
                ...rest
            };
        } else {
            sanitisedObject = {
                billNo: billNo ? String(billNo).trim() : undefined,
                amount: amount !== undefined ? Number(amount) : undefined,
                date: new Date(date),
                amountType: amountType ? String(amountType).toLowerCase() : undefined,
                noOfUpdates: noOfUpdates !== undefined ? Number(noOfUpdates) : 0,
                ...rest
            };
        }

        Object.keys(sanitisedObject).forEach(key => {
            const val = sanitisedObject[key];
            if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
                delete sanitisedObject[key];
            }
        });

        const newEntry = new Model(sanitisedObject);
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);

    } catch (error) {
        console.error("Create Entry Error:", error);
        res.status(500).json({ error: "Failed to create entry. " + error.message });
    }
};

/**
 * Creates the Summary Route (GET).
 */
const createSummaryRoute = (Model) => async (req, res) => {
    const { start: startDateStr, end: endDateStr } = req.query;
    if (!startDateStr || !endDateStr) {
        return res.status(400).json({ error: "Missing dates. Provide start and end." });
    }

    try {
        const startDate = new Date(startDateStr + 'T00:00:00.000Z');
        const endDate = new Date(endDateStr + 'T23:59:59.999Z');
        const isMonthly = req.path.includes('/monthly_summary/');

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
        }

        const pipeline = createAggregationPipeline(startDate, endDate, isMonthly);
        const result = await Model.aggregate(pipeline);

        if (isMonthly) {
            res.status(200).json(result);
        } else {
            const summary = result.length > 0 ? result[0] : { totalAmount: 0, filteredData: [] };
            res.status(200).json(summary);
        }
    } catch (error) {
        console.error(`Aggregation error for ${req.path}:`, error);
        res.status(500).json({ error: `Failed to fetch summary for ${req.path}.` });
    }
};

/**
 * Creates the Accrual Summary Route.
 */
const createAccrualSummaryRoute = (BookingModel, DeliveryModel) => async (req, res) => {
    const { start: startDateStr, end: endDateStr } = req.query;
    if (!startDateStr || !endDateStr) {
        return res.status(400).json({ error: "Missing dates." });
    }

    try {
        const startDate = new Date(startDateStr + 'T00:00:00.000Z');
        const endDate = new Date(endDateStr + 'T23:59:59.999Z');

        const bookings = await BookingModel.find({
            date: { $gte: startDate, $lte: endDate },
            billNo: { $exists: true, $ne: null }
        }).select('billNo').lean();

        const billNos = bookings
            .map(b => b.billNo)
            .filter(b => b && typeof b === 'string' && b.trim().length > 0);

        if (billNos.length === 0) {
            return res.status(200).json({ totalAccrualAmount: 0 });
        }

        const result = await DeliveryModel.aggregate([
            { "$match": { "billNo": { "$in": billNos } } },
            { "$group": { "_id": null, "totalAccrualAmount": { "$sum": "$amount" } } }
        ]);

        const summary = result.length > 0 ? result[0] : { totalAccrualAmount: 0 };
        res.status(200).json(summary);
    } catch (error) {
        console.error(`Accrual Aggregation error:`, error);
        res.status(500).json({ error: "Failed to fetch accrual summary." });
    }
};

/**
 * Creates the Lifetime Summary Route.
 */
const createLifetimeSummaryRoute = (BookingModel, DeliveryModel) => async (req, res) => {
    try {
        const { end: endDateStr } = req.query;
        let endDateFilter = {};

        if (endDateStr) {
            const endDate = new Date(endDateStr + 'T23:59:59.999Z');
            if (!isNaN(endDate.getTime())) {
                endDateFilter = { "date": { "$lte": endDate } };
            }
        }

        const bookingPipeline = [
            { "$match": endDateFilter },
            {
                "$group": {
                    "_id": null,
                    "gross": { "$sum": "$amount" },
                    "cancel": {
                        "$sum": {
                            "$cond": {
                                if: { "$in": [{ "$toLower": "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                                then: "$amount",
                                else: 0
                            }
                        }
                    }
                }
            },
            { "$project": { "net": { "$subtract": ["$gross", "$cancel"] } } }
        ];
        const bookingResult = await BookingModel.aggregate(bookingPipeline);
        const lifetimeNet = bookingResult.length > 0 ? bookingResult[0].net : 0;

        const deliveryPipeline = [
            { "$match": endDateFilter },
            { "$group": { "_id": null, "total": { "$sum": "$amount" } } }
        ];
        const deliveryResult = await DeliveryModel.aggregate(deliveryPipeline);
        const lifetimeDelivery = deliveryResult.length > 0 ? deliveryResult[0].total : 0;

        res.json({
            lifetimeNet,
            lifetimeDelivery,
            lifetimeStock: lifetimeNet - lifetimeDelivery
        });
    } catch (error) {
        console.error("Lifetime Aggregation Error:", error);
        res.status(500).json({ error: "Failed to fetch lifetime summary." });
    }
};

/**
 * Creates the Stock Audit Route.
 */
const createStockAuditRoute = (BookingModel, DeliveryModel, AuditModel) => async (req, res) => {
    try {
        const { status } = req.query;

        if (status === 'verified') {
            const verifiedItems = await AuditModel.find({ status: 'Checked' }).sort({ checkedAt: -1 }).lean();
            return res.json(verifiedItems);
        }

        if (status === 'archived') {
            const archivedItems = await AuditModel.find({ status: 'Archived' }).sort({ checkedAt: -1 }).lean();
            return res.json(archivedItems);
        }

        const checkedDocs = await AuditModel.find({ status: 'Checked' }).select('billNo').lean();
        const checkedBillNos = new Set(checkedDocs.map(d => String(d.billNo).trim()));

        const bookings = await BookingModel.find({ billNo: { $exists: true, $ne: 'other-amounts' } }).lean();
        const deliveries = await DeliveryModel.find({ billNo: { $exists: true } }).select('billNo amount').lean();

        const deliveryMap = {};
        deliveries.forEach(d => {
            const b = String(d.billNo).trim();
            if (!deliveryMap[b]) deliveryMap[b] = 0;
            deliveryMap[b] += (d.amount || 0);
        });

        const pendingStock = [];
        const CANCEL_STATUSES = ["cancel", "canceled", "cancelled", "deducted"];

        bookings.forEach(b => {
            if (!b.billNo) return;
            const billNo = String(b.billNo).trim();
            if (checkedBillNos.has(billNo)) return;
            if (b.status && CANCEL_STATUSES.includes(b.status.toLowerCase())) return;

            const bookedAmount = b.amount || 0;
            const deliveredAmount = deliveryMap[billNo] || 0;
            const balance = bookedAmount - deliveredAmount;

            if (balance > 0) {
                pendingStock.push({
                    billNo: billNo,
                    name: b.name || 'Unknown',
                    date: b.date,
                    phone: b.phone,
                    countryCode: b.countryCode,
                    qty: b.qty || 0,
                    bookedAmount: bookedAmount,
                    deliveredAmount: deliveredAmount,
                    balance: balance
                });
            }
        });

        pendingStock.sort((a, b) => {
            const nA = parseInt(a.billNo);
            const nB = parseInt(b.billNo);
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
            return a.billNo.localeCompare(b.billNo);
        });

        res.json(pendingStock);
    } catch (err) {
        console.error("Stock Audit Error:", err);
        res.status(500).json({ error: "Failed to fetch stock audit." });
    }
};

/**
 * Creates the Audit Verification Route.
 */
const createAuditVerifyRoute = (AuditModel) => async (req, res) => {
    try {
        const { billNo, remark, qty, missingPcs, amount } = req.body;
        if (!billNo) return res.status(400).json({ error: "Bill No is required." });

        const newAudit = new AuditModel({
            billNo: String(billNo).trim(),
            remark: remark || '',
            qty: qty ? Number(qty) : 0,
            missingPcs: missingPcs ? Number(missingPcs) : 0,
            amount: amount ? Number(amount) : 0,
            status: 'Checked',
            checkedAt: new Date()
        });

        await newAudit.save();
        res.status(201).json(newAudit);
    } catch (err) {
        console.error("Audit Verify Error:", err);
        res.status(500).json({ error: "Failed to verify item." });
    }
};

/**
 * Creates the Audit Archive Route.
 */
const createAuditArchiveRoute = (AuditModel) => async (req, res) => {
    try {
        const { auditName } = req.body;
        const label = auditName || `Audit ${new Date().toLocaleDateString()}`;

        const result = await AuditModel.updateMany(
            { status: 'Checked' },
            { $set: { status: 'Archived', batchLabel: label } }
        );

        res.json({ message: "Audit archived successfully.", modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error("Audit Archive Error:", err);
        res.status(500).json({ error: "Failed to archive audit." });
    }
};

/**
 * Creates the Bill Details Route.
 */
const createBillDetailsRoute = (BookingModel, DeliveryModel) => async (req, res) => {
    try {
        const { billNo } = req.query;
        if (!billNo) return res.status(400).json({ error: "Bill No is required." });

        const trimmedBillNo = String(billNo).trim();
        const booking = await BookingModel.findOne({ billNo: trimmedBillNo }).lean();
        const deliveries = await DeliveryModel.find({ billNo: trimmedBillNo }).sort({ date: 1 }).lean();

        res.json({
            booking: booking || null,
            deliveries: deliveries || []
        });
    } catch (err) {
        console.error("Bill Details Error:", err);
        res.status(500).json({ error: "Failed to fetch details." });
    }
};

/**
 * Creates the Employee List Route.
 */
const createEmployeeListRoute = (ExpenseModel) => async (req, res) => {
    try {
        const pipeline = [
            { "$match": { "name": { "$exists": true, "$ne": "" } } },
            { "$sort": { "date": -1 } },
            {
                "$group": {
                    "_id": { "$toLower": "$name" },
                    "originalName": { "$first": "$name" },
                    "dept": { "$first": "$dept" },
                    "cat": { "$first": "$cat" }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "name": "$originalName",
                    "dept": 1,
                    "cat": 1,
                    "val": "$_id"
                }
            },
            { "$sort": { "name": 1 } }
        ];
        const employees = await ExpenseModel.aggregate(pipeline);
        res.json(employees);
    } catch (err) {
        console.error("Employee List Error:", err);
        res.status(500).json({ error: "Failed to fetch employee list." });
    }
};

/**
 * Creates the Employee Summary Route.
 */
const createEmployeeSummaryRoute = (ExpenseModel) => async (req, res) => {
    try {
        const { start, end } = req.query;
        const query = { name: { "$exists": true, "$ne": "" } };

        if (start && end) {
            query.date = {
                $gte: new Date(start + 'T00:00:00.000Z'),
                $lte: new Date(end + 'T23:59:59.999Z')
            };
        }

        const pipeline = [
            { "$match": query },
            {
                "$group": {
                    "_id": { "$toLower": { "$trim": { "input": "$name" } } },
                    "name": { "$first": { "$trim": { "input": "$name" } } },
                    "total": { "$sum": "$amount" },
                    "count": { "$sum": 1 }
                }
            },
            { "$sort": { "total": -1 } }
        ];

        const summary = await ExpenseModel.aggregate(pipeline);
        res.json({ employees: summary });
    } catch (err) {
        console.error("Employee Summary Error:", err);
        res.status(500).json({ error: "Failed to fetch employee summary." });
    }
};

/**
 * Creates the Employee History Route.
 */
const createEmployeeHistoryRoute = (ExpenseModel) => async (req, res) => {
    try {
        const { name, start, end } = req.query;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const cleanName = name.trim();
        const query = {
            name: { $regex: new RegExp(`^\\s*${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }
        };

        if (start && end) {
            query.date = {
                $gte: new Date(start + 'T00:00:00.000Z'),
                $lte: new Date(end + 'T23:59:59.999Z')
            };
        }

        const history = await ExpenseModel.find(query).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        console.error("Employee History Error:", err);
        res.status(500).json({ error: "Failed to fetch employee history." });
    }
};

/**
 * Creates the Daily Ledger Route.
 */
const createDailyLedgerRoute = (BookingModel, DeliveryModel, ExpenseModel) => async (req, res) => {
    try {
        const { date } = req.query;
        const shop = req.originalUrl.split('/')[2];

        if (!date) return res.status(400).json({ error: "Date parameter is required (YYYY-MM-DD)." });

        const selectedDate = new Date(date + 'T00:00:00.000Z');
        const nextDay = new Date(date + 'T23:59:59.999Z');

        if (isNaN(selectedDate.getTime())) return res.status(400).json({ error: "Invalid date." });

        const settings = await LedgerSettings.findOne({ shop });
        const initialBal = settings ? settings.initialBalance : 0;
        const startFrom = settings && settings.startDate ? new Date(settings.startDate) : new Date('2000-01-01');

        let openingBalance = 0;

        if (selectedDate.getTime() === startFrom.getTime()) {
            openingBalance = initialBal;
        } else if (selectedDate < startFrom) {
            openingBalance = 0;
        } else {
            const prevFilter = { date: { $gte: startFrom, $lt: selectedDate } };
            const prevCashDelivery = await DeliveryModel.aggregate([
                {
                    $match: {
                        ...prevFilter,
                        $or: [
                            { amountType: { $exists: false } },
                            { amountType: "" },
                            { amountType: { $regex: /^cash$/i } },
                            { amountType: { $nin: [/atm/i, /adib/i, /card/i, /visa/i, /master/i] } }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const prevExpense = await ExpenseModel.aggregate([
                { $match: prevFilter },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const prevAdj = await LedgerAdjustment.aggregate([
                { $match: { shop, date: { $gte: startFrom, $lt: selectedDate } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const totalPrevCash = prevCashDelivery.length ? prevCashDelivery[0].total : 0;
            const totalPrevExp = prevExpense.length ? prevExpense[0].total : 0;
            const totalPrevAdj = prevAdj.length ? prevAdj[0].total : 0;

            openingBalance = initialBal + totalPrevCash - totalPrevExp + totalPrevAdj;
        }

        const dayFilter = { date: { $gte: selectedDate, $lte: nextDay } };
        const todayAdjustment = await LedgerAdjustment.findOne({ shop, date: { $gte: selectedDate, $lte: nextDay } });
        const adjAmount = todayAdjustment ? todayAdjustment.amount : 0;

        const dayBookings = await BookingModel.aggregate([
            { $match: dayFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const grossBooking = dayBookings.length ? dayBookings[0].total : 0;

        const dayExpenses = await ExpenseModel.aggregate([
            { $match: dayFilter },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalExpense = dayExpenses.length ? dayExpenses[0].total : 0;

        const dayDeliveries = await DeliveryModel.find(dayFilter).lean();

        let totalDailyCash = 0;
        let totalDailyDelivery = 0;
        const deliveryMap = {};

        // Fetch All Daily Entries for the Table
        const entries = [];

        // Add Cash Deliveries as Income/Credit
        dayDeliveries.forEach(d => {
            const amt = d.amount || 0;
            totalDailyDelivery += amt;

            let category = 'CASH';
            let isCash = true;
            if (d.amountType) {
                const typeRaw = String(d.amountType).toUpperCase().trim();
                if (typeRaw.includes('CARD') || typeRaw.includes('VISA') || typeRaw.includes('MASTER') || typeRaw.includes('ADIB')) {
                    category = 'ADIB';
                    isCash = false;
                } else if (typeRaw.includes('ATM')) {
                    category = 'ATM';
                    isCash = false;
                }
            }

            if (!deliveryMap[category]) deliveryMap[category] = 0;
            deliveryMap[category] += amt;

            if (isCash) {
                totalDailyCash += amt;
                entries.push({
                    type: 'credit',
                    category: category,
                    description: `Delivery - ${d.billNo || 'No Bill'}`,
                    amount: amt,
                    billNo: d.billNo,
                    status: d.status
                });
            }
        });

        // Add Bookings as Income/Credit (Order Bookings)
        const bookings = await BookingModel.find(dayFilter).lean();
        bookings.forEach(b => {
            entries.push({
                type: 'credit',
                category: 'ORDER',
                description: `Booking - ${b.billNo || 'No Bill'} (${b.name || 'No Name'})`,
                amount: b.amount || 0,
                billNo: b.billNo,
                status: b.status
            });
        });

        // Add Expenses as Debit
        const expenses = await ExpenseModel.find(dayFilter).lean();
        expenses.forEach(e => {
            entries.push({
                type: 'debit',
                category: e.cat || 'General',
                description: e.description || e.name || 'Expense',
                amount: e.amount || 0,
                status: e.status
            });
        });

        // Add Booking placeholders if any (optional, usually ledger is cash-flow focused)
        // For this app, ledger seems to be cash box focused.

        const closingBalance = (selectedDate < startFrom) ? 0 : (openingBalance + totalDailyCash - totalExpense + adjAmount);

        res.json({
            openingBalance,
            entries, // Added entries list
            deliveryBreakdown: deliveryMap,
            totalDelivery: totalDailyDelivery,
            totalCashDelivery: totalDailyCash,
            totalExpense,
            closingBalance,
            grossBooking,
            adjustments: { // Renamed from adjustment to match dailyLedger.js
                short: adjAmount < 0 ? Math.abs(adjAmount) : 0,
                extra: adjAmount > 0 ? adjAmount : 0,
                note: todayAdjustment ? todayAdjustment.note : ""
            },
            hasSettings: !!settings,
            startDate: settings ? settings.startDate : null
        });
    } catch (err) {
        console.error("Daily Ledger Error:", err);
        res.status(500).json({ error: "Failed to fetch daily ledger." });
    }
};

/**
 * Creates the Ledger History Route (30-day automated).
 */
const createLedgerHistoryRoute = (BookingModel, DeliveryModel, ExpenseModel) => async (req, res) => {
    try {
        const { date: targetDateStr } = req.query;
        const shop = req.originalUrl.split('/')[2];
        const targetDate = targetDateStr ? new Date(targetDateStr + 'T00:00:00.000Z') : new Date();

        const history = [];
        // Calculate for the last 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(targetDate);
            date.setDate(date.getDate() - i);
            date.setUTCHours(0, 0, 0, 0);

            const nextDay = new Date(date);
            nextDay.setUTCHours(23, 59, 59, 999);

            const dayFilter = { date: { $gte: date, $lte: nextDay } };

            // Optimization: These could be aggregated in bulk outside the loop, but for 30 days this is okay for now.
            // Let's do a slightly better way for production later, but for now, this works.
            const [deliveries, expenses, adjustment] = await Promise.all([
                DeliveryModel.find(dayFilter).lean(),
                ExpenseModel.find(dayFilter).lean(),
                LedgerAdjustment.findOne({ shop, date: { $gte: date, $lte: nextDay } })
            ]);

            const cashDelivery = deliveries
                .filter(d => {
                    if (!d.amountType || d.amountType === "" || d.amountType.toLowerCase().includes('cash')) return true;
                    return !(/card|visa|master|adib|atm/i.test(d.amountType));
                })
                .reduce((sum, d) => sum + (d.amount || 0), 0);

            const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
            const adj = adjustment ? adjustment.amount : 0;

            // Note: We are not calculating the opening balance for EACH day here to save time.
            // But the frontend can derive it if needed, or we just show daily delta.
            // Actually, let's just return the basics.
            history.push({
                date: date.toISOString(),
                cash: cashDelivery,
                expense: totalExpense,
                adj: adj,
                inactive: cashDelivery === 0 && totalExpense === 0 && adj === 0
            });
        }

        res.json(history);
    } catch (err) {
        console.error("Ledger History Error:", err);
        res.status(500).json({ error: "Failed to fetch ledger history." });
    }
};

module.exports = {
    createEntryRoute,
    createSummaryRoute,
    createAccrualSummaryRoute,
    createLifetimeSummaryRoute,
    createStockAuditRoute,
    createAuditVerifyRoute,
    createAuditArchiveRoute,
    createBillDetailsRoute,
    createEmployeeListRoute,
    createEmployeeSummaryRoute,
    createEmployeeHistoryRoute,
    createDailyLedgerRoute,
    createLedgerHistoryRoute
};
