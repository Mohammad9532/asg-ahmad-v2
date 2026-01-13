/**
 * Express Backend Server Structure (server.js)
 *
 * This file sets up a dynamic Express server using Mongoose to connect to MongoDB,
 * resolving the 404 errors by dynamically creating all 36 required API endpoints 
 * (9 shops * 4 data types).
 *
 * NOTE: This requires a running MongoDB instance and a correctly configured 
 * .env file with MONGO_URI.
 */

// --- 1. SETUP & CONFIGURATION ---
const express = require('express');
const mongoose = require('mongoose');

// DEBUG: Catch unhandled errors
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
});

const cors = require('cors');
require('dotenv').config();
const Groq = require('groq-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'a_very_secret_key_for_development_only_123';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// app.use(cors) removed - incorrect usage

// --- User Model for Authentication ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    // Inside apiRouter mounted at /api, path is /auth/login
    if (req.path === '/auth/login' || req.path === '/health' || req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.status(401).json({ error: "Access Denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid Token" });
        req.user = user;
        next();
    });
};

// --- Seed Admin User ---
const seedAdminUser = async () => {
    try {
        const hashedPassword = await bcrypt.hash('asg@0259', 10);
        await User.findOneAndUpdate(
            { username: 'admin' },
            { username: 'admin', password: hashedPassword },
            { upsert: true }
        );
        console.log("✅ Admin user updated (admin / asg@0259)");
    } catch (err) {
        console.error("Failed to seed admin user:", err);
    }
};

// --- AI Configuration ---
// Initialize Groq AI with the API Key if available
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}
// Use Llama 3.3 70b (newest versatile model)
const MODEL_NAME = "llama-3.3-70b-versatile";

// --- Configuration ---
const SHOP_NAMES = [
    'Albarieklamaa',
    'Algaidamadam',
    'Gaidamnasir', // CRITICAL FIX: Changed from 'Gaidamanasir' to match database collection name
    'Gaidatailor',
    'Galaxybranch',
    'Galaxyzakhir',
    'Gawanimadam',
    'Naseem',
    'Staralgawani',
];
// CRITICAL FIX: Using a config array to map the singular API PATH to the plural COLLECTION SUFFIX
const DATA_TYPES_CONFIG = [
    // API PATH is singular, Collection Suffix is also 'bookings'
    { path: 'bookings', collectionSuffix: 'bookings' },
    // API PATH is 'delivery' (singular), Collection Suffix is 'deliveries' (plural)
    { path: 'delivery', collectionSuffix: 'deliveries' },
    // API PATH is 'expense' (singular), Collection Suffix is 'expenses' (plural)
    { path: 'expense', collectionSuffix: 'expenses' },
];

// --- Middlewares ---
app.use(express.json());
app.use(cors()); // Enable CORS for frontend connection

// --- Request Logger ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- API Sub-Router ---
const apiRouter = express.Router();

// 1. Health Check (unprotected)
apiRouter.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 2. Auth Endpoints (unprotected)
apiRouter.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: "Invalid password" });

        // Generate Token
        const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

// 3. API Middleware (Protect subsequent routes)
apiRouter.use(authenticateToken);

// Mount the router at /api
app.use('/api', apiRouter);

// --- Utility Functions ---

/**
 * Creates the aggregation pipeline for filtering by date and calculating a total.
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @param {boolean} isMonthly - If true, groups results by month/year.
 */
function createAggregationPipeline(startDate, endDate, isMonthly) {
    const pipeline = [
        // Stage 1: Filter documents by the date range
        {
            "$match": {
                "date": {
                    "$gte": startDate,
                    "$lte": endDate
                }
            }
        }
    ];

    if (isMonthly) {
        // Stage 2 (Monthly): Group by month and year
        pipeline.push({
            "$group": {
                "_id": {
                    "year": { "$year": "$date" },
                    "month": { "$month": "$date" }
                },
                "totalAmount": { "$sum": "$amount" }, // Gross Booking Total
                // NEW: Calculate the sum of canceled/deducted amounts
                "canceledAmount": {
                    "$sum": {
                        "$cond": {
                            // Check for documents with 'Cancel', 'Canceled', 'Cancelled', or 'Deducted' status (case-insensitive)
                            if: { "$in": [{ "$toLower": "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                            then: "$amount",
                            else: 0
                        }
                    }
                },
                "count": { "$sum": 1 }
            }
        });

        // Stage 3 (Monthly): Calculate Net Total and Format Output
        pipeline.push({
            "$project": {
                "_id": {
                    "year": "$_id.year",
                    "month": "$_id.month"
                },
                // Reintroduce monthYear string for clean frontend formatting
                "monthYear": {
                    "$concat": [
                        { "$toString": "$_id.year" },
                        "-",
                        { "$cond": { if: { "$lt": ["$_id.month", 10] }, then: { "$concat": ["0", { "$toString": "$_id.month" }] }, else: { "$toString": "$_id.month" } } }
                    ]
                },
                "totalAmount": 1, // Gross Booking Total
                "canceledAmount": 1, // Canceled/Deducted Amount
                "netTotalAmount": { "$subtract": ["$totalAmount", "$canceledAmount"] }, // Net Total
                "count": 1
            }
        });

        // Stage 4 (Monthly): Sort chronologically (important for the frontend table)
        pipeline.push({
            "$sort": { "monthYear": 1 }
        });

    } else {
        // Stage 2 (Standard): Group all filtered documents and calculate total
        pipeline.push({
            "$group": {
                "_id": null,
                "totalAmount": { "$sum": "$amount" },
                "filteredData": { "$push": "$$ROOT" }
            }
        });

        // Stage 3 (Standard): Clean up the output structure
        pipeline.push({
            "$project": {
                "_id": 0,
                "totalAmount": 1,
                "filteredData": 1
            }
        });
    }


    // Add 4th stage if monthly logic required...
    // ...
    return pipeline;
}

// (The login route and middleware have been moved up)

/**
 * Creates the Create Entry Route (POST).
 * Handles manual addition of Bookings, Deliveries, and Expenses.
 */
const createEntryRoute = (Model, type) => async (req, res) => {
    try {
        const entryData = req.body;

        // Basic Validation
        if (!entryData.date || entryData.amount === undefined) {
            return res.status(400).json({ error: "Date and Amount are required." });
        }

        // Duplicate Bill No Check (STRICTLY for Bookings, excluding 'other-amounts')
        // IF THE TYPE IS 'delivery' OR 'expense', WE SKIP THIS ENTIRE BLOCK.
        if (type === 'bookings' && entryData.billNo && entryData.billNo !== 'other-amounts') {
            const billNoTrimmed = String(entryData.billNo).trim();
            const existingEntry = await Model.findOne({ billNo: billNoTrimmed });
            if (existingEntry) {
                return res.status(400).json({ error: `Duplicate Bill No: ${billNoTrimmed} already exists for this shop.` });
            }
        }

        // Guarantee exact legacy field order:
        let sanitisedObject = {};
        const { billNo, amount, date, amountType, dept, cat, name, noOfUpdates, ...rest } = entryData;

        if (type === 'expense') {
            // ORDER: amount -> date -> dept -> cat -> name -> noOfUpdates
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
            // ORDER: billNo -> name -> date -> countryCode -> phone -> qty -> amount -> noOfUpdates -> status
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
            // Default/Delivery ORDER: billNo -> amount -> date -> amountType -> ...rest
            sanitisedObject = {
                billNo: billNo ? String(billNo).trim() : undefined,
                amount: amount !== undefined ? Number(amount) : undefined,
                date: new Date(date),
                amountType: amountType ? String(amountType).toLowerCase() : undefined,
                noOfUpdates: noOfUpdates !== undefined ? Number(noOfUpdates) : 0,
                ...rest
            };
        }

        // CLEANUP: Remove fields that are undefined or empty strings
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
 * Creates the Express route handler function.
 * @param {mongoose.Model} Model - The Mongoose Model (Booking, Delivery, or Expense).
 */
const createSummaryRoute = (Model) => async (req, res) => {
    const { start: startDateStr, end: endDateStr } = req.query;

    if (!startDateStr || !endDateStr) {
        return res.status(400).json({ error: "Missing dates. Provide start and end." });
    }

    try {
        // Set time boundaries for accurate date filtering
        const startDate = new Date(startDateStr + 'T00:00:00.000Z');
        const endDate = new Date(endDateStr + 'T23:59:59.999Z');

        // Check if this is a request for the monthly summary aggregation
        const isMonthly = req.path.includes('/monthly_summary/');

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
        }

        const pipeline = createAggregationPipeline(startDate, endDate, isMonthly);

        // --- NEW LOGGING FOR DEBUGGING ---
        console.log('--- API Query Start ---');
        console.log(`QUERYING COLLECTION: ${Model.collection.collectionName}`);
        console.log(`DATE RANGE: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        console.log('--- API Query End ---');
        // ---------------------------------

        const result = await Model.aggregate(pipeline);

        // --- NEW LOGGING FOR DEBUGGING ---
        console.log(`RESULT COUNT: ${result.length > 0 && !isMonthly ? result[0].filteredData.length : result.length}`);
        // ---------------------------------

        if (isMonthly) {
            // For monthly, return the array of monthly totals directly
            res.status(200).json(result);
        } else {
            // For standard, return the summary object
            // Use index 0 if available, otherwise return empty structure
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
 * Calculates total delivery amount derived specifically from Bookings made in the date range.
 * Logic: Match Bookings (Date Frame) -> Lookup Deliveries (by billNo) -> Sum Delivery Amounts.
 */
const createAccrualSummaryRoute = (BookingModel, DeliveryModel, DeliveryCollectionName) => async (req, res) => {
    const { start: startDateStr, end: endDateStr } = req.query;

    if (!startDateStr || !endDateStr) {
        return res.status(400).json({ error: "Missing dates." });
    }

    try {
        const startDate = new Date(startDateStr + 'T00:00:00.000Z');
        const endDate = new Date(endDateStr + 'T23:59:59.999Z');

        // Optimization: Use 2-step query to avoid $lookup performance issues
        // 1. Fetch relevant Bill Numbers from Bookings
        const bookings = await BookingModel.find({
            date: { $gte: startDate, $lte: endDate },
            billNo: { $exists: true, $ne: null }
        }).select('billNo').lean();

        // Extract and clean bill numbers
        const billNos = bookings
            .map(b => b.billNo)
            .filter(b => b && typeof b === 'string' && b.trim().length > 0);

        if (billNos.length === 0) {
            return res.status(200).json({ totalAccrualAmount: 0 });
        }

        // 2. Sum amounts of Deliveries that match these Bill Numbers
        const result = await DeliveryModel.aggregate([
            {
                "$match": {
                    "billNo": { "$in": billNos }
                }
            },
            {
                "$group": {
                    "_id": null,
                    "totalAccrualAmount": { "$sum": "$amount" }
                }
            }
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
 * Aggregates ALL-TIME metrics (Net Bookings, Total Deliveries) to calculate Lifetime Stock.
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

        // 1. Calculate Lifetime Net Bookings (Up to End Date)
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
            {
                "$project": {
                    "net": { "$subtract": ["$gross", "$cancel"] }
                }
            }
        ];
        const bookingResult = await BookingModel.aggregate(bookingPipeline);
        const lifetimeNet = bookingResult.length > 0 ? bookingResult[0].net : 0;

        // 2. Calculate Lifetime Deliveries (Up to End Date)
        const deliveryPipeline = [
            { "$match": endDateFilter },
            {
                "$group": {
                    "_id": null,
                    "total": { "$sum": "$amount" }
                }
            }
        ];
        const deliveryResult = await DeliveryModel.aggregate(deliveryPipeline);
        const lifetimeDelivery = deliveryResult.length > 0 ? deliveryResult[0].total : 0;

        // 3. Calculate Stock
        const lifetimeStock = lifetimeNet - lifetimeDelivery;

        res.json({
            lifetimeNet,
            lifetimeDelivery,
            lifetimeStock
        });

    } catch (error) {
        console.error("Lifetime Aggregation Error:", error);
        res.status(500).json({ error: "Failed to fetch lifetime summary." });
    }
};

// --- Mongoose Schema and Model Definition ---
const BookingSchema = new mongoose.Schema({
    billNo: { type: String, index: true },
    name: String,
    date: { type: Date, required: true },
    countryCode: String,
    phone: String,
    qty: Number,
    amount: { type: Number, required: true },
    noOfUpdates: { type: Number, default: 0 },
    status: String
}, { timestamps: true, strict: false });

const DeliverySchema = new mongoose.Schema({
    billNo: { type: String, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    amountType: String,
    noOfUpdates: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

const ExpenseSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    dept: String,
    cat: String,
    name: String,
    noOfUpdates: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

const TargetSchema = new mongoose.Schema({
    shop: String,
    year: Number,
    month: Number, // 0-11
    amount: Number
}, { timestamps: true });

const Target = mongoose.model('Target', TargetSchema);

const AuditSchema = new mongoose.Schema({
    billNo: { type: String, index: true }, // Store as String to match other schemas
    remark: String,
    checkedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Checked' } // 'Checked'
}, { timestamps: true, strict: false });

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully!');
        seedAdminUser();
    })
    .catch(err => {
        console.error('❌ MongoDB connection error. Check your .env file.', err.message);
        process.exit(1);
    });

// ... (Existing Analytics Routes) ...

/**
 * Creates the Stock Audit Route.
 * GET /api/:shop/stock_audit?status=pending|verified
 * 
 * If status=pending (default):
 *   Returns Bill Numbers where (Booking - Delivery) > 0 AND BillNo is NOT in Audit Collection.
 * 
 * If status=verified:
 *   Returns items from Audit Collection.
 */


/**
 * Creates the Stock Audit Route.
 * GET /api/:shop/stock_audit?status=pending|verified
 * 
 * If status=pending (default):
 *   Returns Bill Numbers where (Booking - Delivery) > 0 AND BillNo is NOT in Audit Collection.
 * 
 * If status=verified:
 *   Returns items from Audit Collection.
 */
const createStockAuditRoute = (BookingModel, DeliveryModel, AuditModel) => async (req, res) => {
    try {
        const { status } = req.query;
        const isVerifiedView = status === 'verified';

        if (isVerifiedView) {
            // Return verified history
            const verifiedItems = await AuditModel.find().sort({ checkedAt: -1 }).lean();
            return res.json(verifiedItems);
        }

        // --- PENDING VIEW LOGIC ---

        // 1. Fetch already verified Bill Numbers to exclude
        const verifiedDocs = await AuditModel.find().select('billNo').lean();
        const verifiedBillNos = new Set(verifiedDocs.map(d => String(d.billNo).trim()));

        // 2. Fetch all valid bookings
        const bookings = await BookingModel.find({
            billNo: { $exists: true, $ne: 'other-amounts' }
        }).lean();

        // 3. Fetch all deliveries
        const deliveries = await DeliveryModel.find({
            billNo: { $exists: true }
        }).select('billNo amount').lean();

        // 4. Aggregate deliveries
        const deliveryMap = {};
        deliveries.forEach(d => {
            const b = String(d.billNo).trim();
            if (!deliveryMap[b]) deliveryMap[b] = 0;
            deliveryMap[b] += (d.amount || 0);
        });

        // 5. Calculate Pending Stock
        const pendingStock = [];
        const CANCEL_STATUSES = ["cancel", "canceled", "cancelled", "deducted"];

        bookings.forEach(b => {
            // Skip if no billNo
            if (!b.billNo) return;
            const billNo = String(b.billNo).trim();
            if (!billNo) return;

            // SKIP IF ALREADY VERIFIED
            if (verifiedBillNos.has(billNo)) return;

            // Check status
            if (b.status && CANCEL_STATUSES.includes(b.status.toLowerCase())) {
                return;
            }

            const bookedAmount = b.amount || 0;
            const deliveredAmount = deliveryMap[billNo] || 0;
            const balance = bookedAmount - deliveredAmount;

            // If balance is positive, item is in stock (pending delivery)
            if (balance > 0) {
                pendingStock.push({
                    billNo: billNo,
                    name: b.name || 'Unknown',
                    date: b.date,
                    phone: b.phone,
                    qty: b.qty || 0, // Include Qty (Pcs)
                    bookedAmount: bookedAmount,
                    deliveredAmount: deliveredAmount,
                    balance: balance
                });
            }
        });

        // Sort numerically
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
 * POST /api/:shop/stock_audit/verify
 * Body: { billNo, remark, qty, missingPcs }
 * Saves the item to the Audit Collection.
 */
/**
 * Creates the Audit Verification Route.
 * POST /api/:shop/stock_audit/verify
 * Body: { billNo, remark, qty, missingPcs, amount }
 * Saves the item to the Audit Collection.
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

// --- ANALYTICS ROUTES ---

// Upsert Target
// Upsert Target
apiRouter.post('/targets', authenticateToken, async (req, res) => {
    try {
        const { shop, year, month, amount } = req.body;
        // Upsert: update if exists, otherwise insert
        const target = await Target.findOneAndUpdate(
            { shop, year, month },
            { amount },
            { new: true, upsert: true }
        );
        res.json(target);
    } catch (error) {
        console.error("Save Target Error:", error);
        res.status(500).json({ error: "Failed to save target" });
    }
});

// Get Comparison Data (Actuals + Targets)
apiRouter.get('/analytics/compare', authenticateToken, async (req, res) => {
    try {
        const { shop } = req.query;
        if (!shop) return res.status(400).json({ error: "Shop is required" });

        // 1. Get Actuals (Aggregated Monthly)
        // Robust Lookup: Find model case-insensitively
        const targetSuffix = 'bookingsmodel';
        const targetNameLower = shop.toLowerCase() + targetSuffix;

        const availableModels = Object.keys(mongoose.models);
        let Model; // Declare Model here
        const actualModelName = availableModels.find(m => m.toLowerCase() === targetNameLower);

        if (actualModelName) {
            Model = mongoose.models[actualModelName];
        } else {
            // Fallback: Try finding any model that starts with the shop and ends with BookingsModel
            const fuzzyMatch = availableModels.find(m =>
                m.toLowerCase().startsWith(shop.toLowerCase()) &&
                m.toLowerCase().endsWith('bookingsmodel')
            );
            if (fuzzyMatch) Model = mongoose.models[fuzzyMatch];
        }

        if (!Model) {
            console.error(`[COMPARE ERROR] Model not found for shop: ${shop}. Searched for: ${targetNameLower}`);
            return res.status(404).json({ error: `Data model not found for ${shop}. Available: ${availableModels.length}` });
        }

        const actualsAgg = await Model.aggregate([
            {
                $addFields: {
                    // Safe convert to date, map errors/nulls to null
                    dateObj: {
                        $convert: {
                            input: "$date",
                            to: "date",
                            onError: null,
                            onNull: null
                        }
                    }
                }
            },
            {
                $match: {
                    dateObj: { $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$dateObj" },
                        month: { $month: "$dateObj" } // 1-12
                    },
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // Format Actuals: { 2024: { 0: 100, 1: 200... } } (Map month 1-12 to 0-11 index?)
        // JS Dates uses 0-11. Mongo $month returns 1-12. Let's send 0-11 to frontend.
        const actuals = {};
        actualsAgg.forEach(item => {
            const y = item._id.year;
            const m = item._id.month - 1; // Convert to 0-11
            if (!actuals[y]) actuals[y] = {};
            actuals[y][m] = item.total;
        });

        // 2. Get Targets
        const targets = await Target.find({ shop });
        const targetsObj = {};
        targets.forEach(t => {
            if (!targetsObj[t.year]) targetsObj[t.year] = {};
            targetsObj[t.year][t.month] = t.amount;
        });

        res.json({ actuals, targets: targetsObj });

    } catch (error) {
        console.error("Comparison Data Error:", error);
        res.status(500).json({ error: "Comparison Error: " + error.message });
    }
});


// --- Dynamic Route and Model Creation ---

SHOP_NAMES.forEach(shopPrefix => {

    // Determine the lowercase prefix for MongoDB collections
    const collectionPrefix = shopPrefix.toLowerCase();

    // 1. Create Models and Standard Routes (Bookings, Delivery, Expense)
    DATA_TYPES_CONFIG.forEach(config => {
        // Collection name pattern uses the explicit suffix (e.g., naseemdeliveries)
        const collectionName = `${collectionPrefix}${config.collectionSuffix}`;

        // Create Model Name using the singular path (e.g., NaseemDeliveryModel)
        const modelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + config.path.charAt(0).toUpperCase() + config.path.slice(1) + 'Model';

        // Create the Mongoose Model, linking it to the specific plural collection
        let currentSchema;
        if (config.path === 'bookings') currentSchema = BookingSchema;
        else if (config.path === 'delivery') currentSchema = DeliverySchema;
        else if (config.path === 'expense') currentSchema = ExpenseSchema;

        const Model = mongoose.model(modelName, currentSchema, collectionName);

        // Create the API route using the singular path relative to apiRouter
        const apiPath = `/${shopPrefix}/${config.path}/summary`;
        apiRouter.get(apiPath, createSummaryRoute(Model));

        // NEW: Create POST route for manual entry
        const createPath = `/${shopPrefix}/${config.path}/create`;
        apiRouter.post(createPath, createEntryRoute(Model, config.path));
    });

    // 2. Create Monthly Summary Route
    const monthlyCollectionName = `${collectionPrefix}bookings`; // Monthly summary based on bookings data

    const MonthlyModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'MonthlySummaryModel';
    const MonthlyModel = mongoose.model(MonthlyModelName, BookingSchema, monthlyCollectionName);

    // CRITICAL FIX: Ensure the route path matches the client's request
    const monthlyRoutePath = `/${shopPrefix}/monthly_summary/summary`;
    apiRouter.get(monthlyRoutePath, createSummaryRoute(MonthlyModel));


    // 3. Create Accrual Summary Route (New Requirement)
    // Find the Models we just created/retrieved
    const bookingsModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'BookingsModel';
    const deliveryModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'DeliveryModel';

    // We need the raw collection name for $lookup
    const deliveryCollectionName = `${collectionPrefix}deliveries`;

    // Retrieve Mongoose Models safely
    const BookingsModel = mongoose.model(bookingsModelName);
    const DeliveryModel = mongoose.model(deliveryModelName);

    // NEW: Create/Retrieve Audit Model
    const auditCollectionName = `${collectionPrefix}audit`;
    const auditModelName = shopPrefix.charAt(0).toUpperCase() + shopPrefix.slice(1) + 'AuditModel';
    const AuditModel = mongoose.models[auditModelName] || mongoose.model(auditModelName, AuditSchema, auditCollectionName);

    apiRouter.get(`/${shopPrefix}/accrual_delivery/summary`, createAccrualSummaryRoute(BookingsModel, DeliveryModel, deliveryCollectionName));

    // Stock Audit Route (Pending & Verified)
    apiRouter.get(`/${shopPrefix}/stock_audit`, createStockAuditRoute(BookingsModel, DeliveryModel, AuditModel));

    // Verify Audit Item
    apiRouter.post(`/${shopPrefix}/stock_audit/verify`, createAuditVerifyRoute(AuditModel));

    apiRouter.get(`/${shopPrefix}/lifetime/summary`, createLifetimeSummaryRoute(BookingsModel, DeliveryModel));

});

// --- AI Chat Endpoint ---
apiRouter.post('/ai/chat', async (req, res) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        if (!groq) {
            return res.status(500).json({ error: "Server missing Groq API client. Please configure GROQ_API_KEY." });
        }

        // Construct a helpful system-like prompt with the provided context
        const contextString = context ? JSON.stringify(context, null, 2) : "No specific data context provided.";

        const fullPrompt = `
You are a helpful AI Business Assistant for a Shop Data Dashboard. 
You are analyzing business data for the following context:
${contextString}

User Question: ${prompt}

Guidance:
- Answer the user's question based strictly on the provided data context.
- Highlight key trends, totals, or anomalies if relevant.
- Be professional, concise, and encouraging.
- If the data isn't in the context, say you don't have that information.
- Format your response in Markdown (bold for numbers, lists for clarity).
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful data analysis assistant." },
                { role: "user", content: fullPrompt }
            ],
            model: MODEL_NAME,
            temperature: 0.5,
            max_tokens: 1024,
        });

        const text = chatCompletion.choices[0]?.message?.content || "No response generated.";
        res.json({ response: text });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "Failed to generate AI response. " + error.message });
    }
});

// --- API 404 Handler ---
// Catch any missed /api/* requests and return JSON
// In Express 5, use path-to-regexp style or just '*'
apiRouter.use((req, res) => {
    console.warn(`[404] Unmatched API Route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: "Not Found",
        message: `The API endpoint ${req.method} ${req.originalUrl} does not exist.`,
        requestedPath: req.originalUrl
    });
});

// --- Static Files & SPA Support ---
// For local development, we serve static files from the root (parent of /api)
const path = require('path');
// --- Export app for Vercel ---
module.exports = app;

// --- Server Start Listener (for local dev) ---
if (require.main === module) {
    // Serve static files locally
    // Serve static files locally from the 'client' directory
    app.use(express.static(path.join(__dirname, '../client')));

    // Fallback: serve index.html for any non-API routes (SPA support)
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            return res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
        }
        next();
    });

    // DEBUG: Global Error Handler
    app.use((err, req, res, next) => {
        console.error('Express Error Handler:', err);
        res.status(500).send('Internal Server Error: ' + err.message);
    });

    app.listen(PORT, () => {
        console.log(`🌍 Server is running on http://localhost:${PORT}`);
        console.log(`--- Ready to serve dynamic endpoints ---`);
    });
}
