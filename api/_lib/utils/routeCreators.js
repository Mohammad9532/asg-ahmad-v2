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
 * Creates the Update Entry Route (PUT).
 */
const updateEntryRoute = (Model, type) => async (req, res) => {
    try {
        const { id } = req.params;
        const entryData = req.body;

        if (!entryData.date || entryData.amount === undefined) {
            return res.status(400).json({ error: "Date and Amount are required." });
        }

        const existingDoc = await Model.findById(id);
        if (!existingDoc) {
            return res.status(404).json({ error: "Entry not found." });
        }

        if (type === 'bookings' && entryData.billNo && entryData.billNo !== 'other-amounts') {
            const billNoTrimmed = String(entryData.billNo).trim();
            if (existingDoc.billNo !== billNoTrimmed) {
                const duplicateEntry = await Model.findOne({ billNo: billNoTrimmed });
                if (duplicateEntry) {
                    return res.status(400).json({ error: `Duplicate Bill No: ${billNoTrimmed} already exists for this shop.` });
                }
            }
        }

        let sanitisedObject = {};
        const { billNo, amount, date, amountType, dept, cat, name, ...rest } = entryData;

        if (type === 'expense') {
            sanitisedObject = {
                amount: amount !== undefined ? Number(amount) : undefined,
                date: new Date(date),
                dept: dept ? String(dept).toLowerCase() : undefined,
                cat: cat ? String(cat).toLowerCase() : undefined,
                name: name ? String(name).toLowerCase() : undefined,
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
                status: status ? String(status).toLowerCase() : undefined,
                ...rest
            };
        } else {
            sanitisedObject = {
                billNo: billNo ? String(billNo).trim() : undefined,
                amount: amount !== undefined ? Number(amount) : undefined,
                date: new Date(date),
                amountType: amountType ? String(amountType).toLowerCase() : undefined,
                ...rest
            };
        }

        // Clean undefined manually so it doesn't overwrite with nulls if not provided in payload
        Object.keys(sanitisedObject).forEach(key => {
            if (sanitisedObject[key] === undefined) {
                delete sanitisedObject[key];
            } else if (sanitisedObject[key] === null || (typeof sanitisedObject[key] === 'string' && sanitisedObject[key].trim() === '')) {
                // If it's explicitly cleared, set to null or empty string to overwrite existing db value
                if (typeof sanitisedObject[key] === 'string') sanitisedObject[key] = '';
                else sanitisedObject[key] = null;
            }
        });

        sanitisedObject.noOfUpdates = (existingDoc.noOfUpdates || 0) + 1;

        const updatedEntry = await Model.findByIdAndUpdate(id, { $set: sanitisedObject }, { new: true });
        res.status(200).json(updatedEntry);

    } catch (error) {
        console.error("Update Entry Error:", error);
        res.status(500).json({ error: "Failed to update entry. " + error.message });
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
        const { status, start, end } = req.query;

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

        const bookingsQuery = { billNo: { $exists: true, $ne: 'other-amounts' } };
        if (start && end) {
            bookingsQuery.date = {
                $gte: new Date(start + 'T00:00:00.000Z'),
                $lte: new Date(end + 'T23:59:59.999Z')
            };
        }

        const bookings = await BookingModel.find(bookingsQuery).lean();
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
 * Creates the Audit Delete Route (Undo verify).
 */
const createAuditDeleteRoute = (AuditModel) => async (req, res) => {
    try {
        const { id } = req.params;
        const result = await AuditModel.findByIdAndDelete(id);

        if (!result) return res.status(404).json({ error: "Audit item not found." });

        res.json({ message: "Audit item successfully deleted/undone." });
    } catch (err) {
        console.error("Audit Delete Error:", err);
        res.status(500).json({ error: "Failed to delete audit item." });
    }
};

/**
 * Creates the Audit Edit Route.
 */
const createAuditEditRoute = (AuditModel) => async (req, res) => {
    try {
        const { id } = req.params;
        const { remark, missingPcs, qty, amount } = req.body;

        const updatedAudit = await AuditModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    remark: remark || '',
                    missingPcs: missingPcs ? Number(missingPcs) : 0,
                    qty: qty ? Number(qty) : 0,
                    amount: amount ? Number(amount) : 0
                }
            },
            { new: true }
        );

        if (!updatedAudit) return res.status(404).json({ error: "Audit item not found." });

        res.json(updatedAudit);
    } catch (err) {
        console.error("Audit Edit Error:", err);
        res.status(500).json({ error: "Failed to update audit item." });
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
                    "_id": { "$toLower": { "$trim": { "input": "$name" } } },
                    "originalName": { "$first": { "$trim": { "input": "$name" } } },
                    "dept": { "$first": { "$trim": { "input": "$dept" } } },
                    "cat": { "$first": { "$trim": { "input": "$cat" } } }
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
                    "count": { "$sum": 1 },
                    "dept": { "$first": { "$trim": { "input": "$dept" } } },
                    "cat": { "$first": { "$trim": { "input": "$cat" } } }
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
                    status: d.status,
                    raw: d,
                    dataType: 'delivery'
                });
            }
        });

        // Remove Bookings as Income/Credit (Order Bookings)
        // Bookings are recorded separately and are not necessarily cash physically received today.
        // The grossBooking total is already calculated above for the top cards.

        // Add Expenses as Debit
        const expenses = await ExpenseModel.find(dayFilter).lean();
        expenses.forEach(e => {
            entries.push({
                type: 'debit',
                category: e.cat || 'General',
                description: e.description || e.name || 'Expense',
                amount: e.amount || 0,
                status: e.status,
                raw: e,
                dataType: 'expense'
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
        const mongoose = require('mongoose');
        const LedgerSettings = mongoose.model('LedgerSettings');
        const LedgerAdjustment = mongoose.model('LedgerAdjustment');

        // 1. Fetch Settings to establish baseline
        const settings = await LedgerSettings.findOne({ shop });
        const startFrom = settings && settings.startDate ? new Date(settings.startDate) : new Date('2000-01-01');
        const initialBal = settings && settings.initialBalance ? settings.initialBalance : 0;

        // 2. Fetch all data for the 30 day window, PLUS historical data before the window to get opening balance
        const thirtyDaysAgo = new Date(targetDate);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 30 days inclusive
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

        // Actual calculation window starts from either the settings startDate, or 30 days ago, whichever is EARLIER, 
        // to ensure we can build up the running mathematical balance.
        const calcStart = thirtyDaysAgo < startFrom ? thirtyDaysAgo : startFrom;

        // Fetch all relevant historical data from calcStart to targetDate
        const allDeliveries = await DeliveryModel.find({ date: { $gte: calcStart, $lte: targetDate } }).lean();
        const allExpenses = await ExpenseModel.find({ date: { $gte: calcStart, $lte: targetDate } }).lean();
        const allAdjustments = await LedgerAdjustment.find({ shop, date: { $gte: calcStart, $lte: targetDate } }).lean();

        // Helper to sum by date string YYYY-MM-DD
        const mapByDate = (arr, valKey, isDeliveryFunc = null) => {
            const map = {};
            arr.forEach(item => {
                if (!item.date) return;
                const dKey = new Date(item.date).toISOString().split('T')[0];
                if (!map[dKey]) map[dKey] = 0;

                let amount = item[valKey] || item.amount || 0;
                // Specifically for cash deliveries vs card
                if (isDeliveryFunc && !isDeliveryFunc(item)) amount = 0;

                map[dKey] += amount;
            });
            return map;
        };

        const cashCriteria = (d) => {
            if (!d.amountType || d.amountType === "" || d.amountType.toLowerCase().includes('cash')) return true;
            return !(/card|visa|master|adib|atm/i.test(d.amountType));
        };

        const deliveryMap = mapByDate(allDeliveries, 'amount', cashCriteria);
        const expenseMap = mapByDate(allExpenses, 'amount');
        const adjustMap = mapByDate(allAdjustments, 'amount');

        // Track running balance
        let currentRunningBalance = initialBal;

        // We must iterate day by day from 'startFrom' up to 'targetDate' to build the running balance accurately.
        const iterDate = new Date(startFrom);
        iterDate.setUTCHours(0, 0, 0, 0);

        const historyMap = {}; // Store chronological history objects

        while (iterDate <= targetDate) {
            const dKey = iterDate.toISOString().split('T')[0];

            const dayInc = deliveryMap[dKey] || 0;
            const dayExp = expenseMap[dKey] || 0;
            const dayAdj = adjustMap[dKey] || 0;

            // Apply daily math
            currentRunningBalance = currentRunningBalance + dayInc - dayExp + dayAdj;

            historyMap[dKey] = {
                date: iterDate.toISOString(),
                income: dayInc,
                expense: dayExp,
                adj: dayAdj,
                closing: currentRunningBalance
            };

            iterDate.setDate(iterDate.getDate() + 1);
        }

        // 3. Extract just the requested 30 days in reverse chronological order
        const history = [];
        for (let i = 0; i < 30; i++) {
            const reqDate = new Date(targetDate);
            reqDate.setDate(reqDate.getDate() - i);
            const rKey = reqDate.toISOString().split('T')[0];

            if (historyMap[rKey]) {
                // Return calculated day
                history.push(historyMap[rKey]);
            } else {
                // If before start date, return empty stats
                history.push({
                    date: reqDate.toISOString(),
                    income: 0,
                    expense: 0,
                    adj: 0,
                    closing: 0
                });
            }
        }

        res.json(history);
    } catch (err) {
        console.error("Ledger History Error:", err);
        res.status(500).json({ error: "Failed to fetch ledger history." });
    }
};

/**
 * Creates the Compare Bookings Route
 * Expects query params: startA, endA, startB, endB (YYYY-MM-DD)
 */
const createCompareBookingsRoute = (BookingModel) => async (req, res) => {
    try {
        const { startA, endA, startB, endB } = req.query;

        if (!startA || !endA || !startB || !endB) {
            return res.status(400).json({ error: "Missing required date parameters." });
        }

        const dateAStart = new Date(startA + 'T00:00:00.000Z');
        const dateAEnd = new Date(endA + 'T23:59:59.999Z');
        const dateBStart = new Date(startB + 'T00:00:00.000Z');
        const dateBEnd = new Date(endB + 'T23:59:59.999Z');

        // Helper to aggregate stats for a specific period
        const getPeriodStats = async (start, end) => {
            const bookings = await BookingModel.find({ date: { $gte: start, $lte: end } }).lean();

            let gross = 0;
            let cancel = 0;
            let net = 0;
            const dailyMap = {};

            bookings.forEach(b => {
                const amt = b.amount || 0;
                gross += amt;
                const dKey = new Date(b.date).toISOString().split('T')[0];

                if (!dailyMap[dKey]) dailyMap[dKey] = { gross: 0, cancel: 0, net: 0, count: 0 };
                dailyMap[dKey].count += 1;
                dailyMap[dKey].gross += amt;

                const status = String(b.status || '').toLowerCase().trim();
                // Match isCanceledStatus logic
                if (status.includes('cancel') || status.includes('refund') || status.includes('wrong') || status.includes('delete') || status.includes('fraud')) {
                    cancel += amt;
                    dailyMap[dKey].cancel += amt;
                } else {
                    net += amt;
                    dailyMap[dKey].net += amt;
                }
            });

            return {
                gross,
                cancel,
                net,
                count: bookings.length,
                dailyData: dailyMap
            };
        };

        const [periodA, periodB] = await Promise.all([
            getPeriodStats(dateAStart, dateAEnd),
            getPeriodStats(dateBStart, dateBEnd)
        ]);

        res.json({
            periodA: {
                label: `${startA} to ${endA}`,
                stats: periodA
            },
            periodB: {
                label: `${startB} to ${endB}`,
                stats: periodB
            }
        });

    } catch (err) {
        console.error("Compare Bookings Error:", err);
        res.status(500).json({ error: "Failed to fetch comparison data." });
    }
};

/**
 * Creates the Excess Delivery Route.
 * Finds bills where total delivered amount > original booked amount.
 */
const createExcessDeliveryRoute = (BookingModel, DeliveryModel, AuditModel) => async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build base query for bookings
        let bookingsQuery = { billNo: { $exists: true, $ne: 'other-amounts' } };

        // Optional date filtering
        if (startDate && endDate) {
            bookingsQuery.date = {
                $gte: new Date(startDate),
                $lte: new Date(`${endDate}T23:59:59.999Z`)
            };
        }

        const bookings = await BookingModel.find(bookingsQuery).lean();
        const billNos = bookings.map(b => String(b.billNo).trim());

        const deliveries = await DeliveryModel.find({ billNo: { $in: billNos } }).select('billNo amount').lean();
        const deliveryMap = {};
        deliveries.forEach(d => {
            const b = String(d.billNo).trim();
            if (!deliveryMap[b]) deliveryMap[b] = 0;
            deliveryMap[b] += (d.amount || 0);
        });

        const auditRecords = await AuditModel.find({ billNo: { $in: billNos } }).lean();
        const auditMap = {};
        auditRecords.forEach(a => {
            auditMap[String(a.billNo).trim()] = a;
        });

        const excessDeliveries = [];
        const cancelledDeliveries = [];
        const manualDiscrepancies = [];
        const CANCEL_STATUSES = ["cancel", "canceled", "cancelled", "deducted"];

        bookings.forEach(b => {
            if (!b.billNo) return;
            const billNo = String(b.billNo).trim();
            const bookedAmount = b.amount || 0;
            const deliveredAmount = deliveryMap[billNo] || 0;
            const audit = auditMap[billNo];
            const isCancelled = b.status && CANCEL_STATUSES.includes(b.status.toLowerCase());

            // 1. Cancelled Bill Deliveries
            if (isCancelled) {
                if (deliveredAmount > 0) {
                    cancelledDeliveries.push({
                        billNo,
                        name: b.name || 'Unknown',
                        date: b.date,
                        phone: b.phone,
                        countryCode: b.countryCode,
                        bookedAmount,
                        deliveredAmount,
                        status: b.status
                    });
                }
                return;
            }

            // 2. Excess Deliveries (Delivery > Booking)
            const extraAmount = deliveredAmount - bookedAmount;
            if (extraAmount > 0) {
                excessDeliveries.push({
                    billNo,
                    name: b.name || 'Unknown',
                    date: b.date,
                    phone: b.phone,
                    countryCode: b.countryCode,
                    qty: b.qty || 0,
                    bookedAmount,
                    deliveredAmount,
                    extraAmount
                });
            }

            // 3. Manual Audit Overrides
            if (audit) {
                const calculatedBalance = bookedAmount - deliveredAmount;
                const actualAuditAmount = audit.amount || 0;
                if (Math.abs(actualAuditAmount - calculatedBalance) > 0.01) {
                    manualDiscrepancies.push({
                        billNo,
                        name: b.name || 'Unknown',
                        date: b.date,
                        calculatedBalance,
                        actualAuditAmount,
                        diff: actualAuditAmount - calculatedBalance,
                        remark: audit.remark
                    });
                }
            }
        });

        // Sort by highest amount/impact
        excessDeliveries.sort((a, b) => b.extraAmount - a.extraAmount);
        cancelledDeliveries.sort((a, b) => b.deliveredAmount - a.deliveredAmount);
        manualDiscrepancies.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

        res.json({
            excess: excessDeliveries,
            cancelled: cancelledDeliveries,
            manual: manualDiscrepancies
        });
    } catch (err) {
        console.error("Excess Delivery Error:", err);
        res.status(500).json({ error: "Failed to fetch excess deliveries." });
    }
};

module.exports = {
    createEntryRoute,
    updateEntryRoute,
    createSummaryRoute,
    createAccrualSummaryRoute,
    createLifetimeSummaryRoute,
    createStockAuditRoute,
    createAuditVerifyRoute,
    createAuditArchiveRoute,
    createAuditEditRoute,
    createAuditDeleteRoute,
    createBillDetailsRoute,
    createEmployeeListRoute,
    createEmployeeSummaryRoute,
    createEmployeeHistoryRoute,
    createDailyLedgerRoute,
    createLedgerHistoryRoute,
    createCompareBookingsRoute,
    createExcessDeliveryRoute,
    createDiscrepancyDiagnosticRoute: (BookingModel, DeliveryModel) => async (req, res) => {
        try {
            const { start, end } = req.query;
            const startDate = new Date(start + 'T00:00:00.000Z');
            const endDate = new Date(end + 'T23:59:59.999Z');

            const bookings = await BookingModel.find({
                date: { $gte: startDate, $lte: endDate },
                billNo: { $exists: true, $ne: 'other-amounts' }
            }).lean();

            const billNos = bookings.map(b => String(b.billNo).trim());
            const deliveries = await DeliveryModel.find({ billNo: { $in: billNos } }).lean();

            const deliveryMap = {};
            deliveries.forEach(d => {
                const b = String(d.billNo).trim();
                if (!deliveryMap[b]) deliveryMap[b] = 0;
                deliveryMap[b] += (d.amount || 0);
            });

            const CANCEL_STATUSES = ["cancel", "canceled", "cancelled", "deducted"];
            const results = [];

            bookings.forEach(b => {
                const billNo = String(b.billNo).trim();
                const bookedAmt = b.amount || 0;
                const delAmt = deliveryMap[billNo] || 0;
                const isCancelled = b.status && CANCEL_STATUSES.includes(b.status.toLowerCase());

                const dashboardNet = isCancelled ? 0 : bookedAmt;
                const dashboardStock = dashboardNet - delAmt;

                let auditStock = 0;
                if (!isCancelled) {
                    auditStock = Math.max(0, bookedAmt - delAmt);
                }

                if (Math.abs(dashboardStock - auditStock) > 0.01) {
                    results.push({
                        billNo,
                        status: b.status,
                        bookedAmt,
                        delAmt,
                        dashboardStock,
                        auditStock,
                        diff: auditStock - dashboardStock
                    });
                }
            });

            res.json({
                totalDiff: results.reduce((s, r) => s + r.diff, 0),
                count: results.length,
                topOffenders: results.sort((a, b) => b.diff - a.diff).slice(0, 50)
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
