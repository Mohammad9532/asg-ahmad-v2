const express = require('express');
const mongoose = require('mongoose');
const { SHOP_NAMES } = require('../utils/constants');
const { authenticateToken } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

const router = express.Router();

/**
 * GET /api/global/summary
 * Fetches high-level metrics (Net Bookings, Deliveries, Expenses, Accrual) for ALL shops in one go.
 */
router.get('/global/summary', authenticateToken, cacheMiddleware(300), async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: "Start and end dates are required." });
        }

        const startDate = new Date(start + 'T00:00:00.000Z');
        const endDate = new Date(end + 'T23:59:59.999Z');

        const results = {};

        // Helper to run aggregations for a single shop
        const fetchShopSummary = async (shop) => {
            const shopPrefix = shop.charAt(0).toUpperCase() + shop.slice(1);

            const BookingsModel = mongoose.models[`${shopPrefix}BookingsModel`];
            const DeliveryModel = mongoose.models[`${shopPrefix}DeliveryModel`];
            const ExpenseModel = mongoose.models[`${shopPrefix}ExpenseModel`];

            if (!BookingsModel || !DeliveryModel || !ExpenseModel) {
                throw new Error(`Models for ${shop} are not registered. Check shopRoutes.js initialization.`);
            }

            // 1. Net Bookings
            const bookingMetrics = await BookingsModel.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        gross: { $sum: "$amount" },
                        cancel: {
                            $sum: {
                                $cond: {
                                    if: { "$in": [{ "$toLower": "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                                    then: "$amount",
                                    else: 0
                                }
                            }
                        }
                    }
                }
            ]);

            const gross = bookingMetrics.length > 0 ? bookingMetrics[0].gross : 0;
            const cancel = bookingMetrics.length > 0 ? bookingMetrics[0].cancel : 0;
            const net = gross - cancel;

            // 2. Total Deliveries & Payment Methods
            const deliveryMetrics = await DeliveryModel.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" },
                        // Separate Booking vs Misc
                        bookingDel: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ["$billNo", null] },
                                            { $ne: ["$billNo", ""] },
                                            { $ne: [{ $toLower: "$billNo" }, "other-amounts"] }
                                        ]
                                    },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        miscDel: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$billNo", null] },
                                            { $eq: ["$billNo", ""] },
                                            { $eq: [{ $toLower: "$billNo" }, "other-amounts"] }
                                        ]
                                    },
                                    "$amount",
                                    0
                                ]
                            }
                        },
                        // Payment Type aggregation
                        cash: { $sum: { $cond: [{ $regexMatch: { input: { $ifNull: ["$amountType", "CASH"] }, regex: /cash/i } }, "$amount", 0] } },
                        adib: { $sum: { $cond: [{ $regexMatch: { input: { $ifNull: ["$amountType", ""] }, regex: /card|visa|master|adib/i } }, "$amount", 0] } },
                        atm: { $sum: { $cond: [{ $regexMatch: { input: { $ifNull: ["$amountType", ""] }, regex: /atm/i } }, "$amount", 0] } }
                    }
                }
            ]);

            const delRes = deliveryMetrics.length > 0 ? deliveryMetrics[0] : { totalAmount: 0, bookingDel: 0, miscDel: 0, cash: 0, adib: 0, atm: 0 };

            // Adjust Cash to be the fallback for anything not ADIB/ATM
            const other = delRes.totalAmount - (delRes.cash + delRes.adib + delRes.atm);
            const finalCash = delRes.cash + other;

            // 3. Total Expenses (Split: Operational vs Profit)
            const expenseMetrics = await ExpenseModel.aggregate([
                { $match: { date: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        totalExp: {
                            $sum: {
                                $cond: {
                                    if: { $ne: [{ $toLower: "$dept" }, "profit"] },
                                    then: "$amount",
                                    else: 0
                                }
                            }
                        },
                        totalProfit: {
                            $sum: {
                                $cond: {
                                    if: { $eq: [{ $toLower: "$dept" }, "profit"] },
                                    then: "$amount",
                                    else: 0
                                }
                            }
                        }
                    }
                }
            ]);
            const totalExpense = expenseMetrics.length > 0 ? expenseMetrics[0].totalExp : 0;
            const profitPayout = expenseMetrics.length > 0 ? expenseMetrics[0].totalProfit : 0;

            // 4. Accrual Deliveries
            const bookings = await BookingsModel.find({
                date: { $gte: startDate, $lte: endDate },
                billNo: { $exists: true, $ne: null }
            }).select('billNo').lean();
            const billNos = bookings
                .map(b => b.billNo)
                .filter(b => b !== null && b !== undefined)
                .map(b => String(b).trim())
                .filter(b => b.length > 0);

            let accrualDelivery = 0;
            if (billNos.length > 0) {
                const accMetrics = await DeliveryModel.aggregate([
                    { $match: { billNo: { $in: billNos } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                accrualDelivery = accMetrics.length > 0 ? accMetrics[0].total : 0;
            }

            // 5. Lifetime metrics (simplified)
            const lifetimeBooking = await BookingsModel.aggregate([
                { $match: { date: { $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        net: {
                            $sum: {
                                $cond: {
                                    if: { $in: [{ $toLower: "$status" }, ["cancel", "canceled", "cancelled", "deducted"]] },
                                    then: 0,
                                    else: "$amount"
                                }
                            }
                        }
                    }
                }
            ]);
            const lifeNet = lifetimeBooking.length > 0 ? lifetimeBooking[0].net : 0;

            const lifetimeDelivery = await DeliveryModel.aggregate([
                { $match: { date: { $lte: endDate } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const lifeDel = lifetimeDelivery.length > 0 ? lifetimeDelivery[0].total : 0;

            return {
                bookings: { totalAmount: gross, netAmount: net, cancelAmount: cancel, filteredData: [] },
                delivery: {
                    totalAmount: delRes.totalAmount,
                    bookingDel: delRes.bookingDel,
                    miscDel: delRes.miscDel,
                    paymentMethods: { CASH: finalCash, ADIB: delRes.adib, ATM: delRes.atm },
                    filteredData: []
                },
                expense: { totalAmount: totalExpense, profitPayout: profitPayout, filteredData: [] },
                accrual_delivery: { totalAccrualAmount: accrualDelivery },
                lifetime: { lifetimeNet: lifeNet, lifetimeDelivery: lifeDel, lifetimeStock: lifeNet - lifeDel }
            };
        };

        // Run all shops in parallel
        const shopPromises = SHOP_NAMES.map(async (shop) => {
            try {
                const summary = await fetchShopSummary(shop);
                results[shop] = summary;
            } catch (shopError) {
                console.error(`Error fetching summary for ${shop}:`, shopError);
                // Return empty/placeholder for this specific shop so the whole app doesn't break
                results[shop] = {
                    bookings: { totalAmount: 0, netAmount: 0, cancelAmount: 0, filteredData: [], error: shopError.message },
                    delivery: { totalAmount: 0, bookingDel: 0, miscDel: 0, paymentMethods: { CASH: 0, ADIB: 0, ATM: 0 }, filteredData: [] },
                    expense: { totalAmount: 0, profitPayout: 0, filteredData: [] },
                    accrual_delivery: { totalAccrualAmount: 0 },
                    lifetime: { lifetimeNet: 0, lifetimeDelivery: 0, lifetimeStock: 0 }
                };
            }
        });

        await Promise.all(shopPromises);

        res.json(results);

    } catch (error) {
        console.error("Global Summary Error:", error);
        res.status(500).json({ error: "Failed to fetch global summary: " + error.message });
    }
});

module.exports = router;
