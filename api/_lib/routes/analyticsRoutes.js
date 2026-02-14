const express = require('express');
const mongoose = require('mongoose');
const Target = require('../models/Target');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Upsert Target
router.post('/targets', authenticateToken, async (req, res) => {
    try {
        const { shop, year, month, amount } = req.body;
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
router.get('/analytics/compare', authenticateToken, async (req, res) => {
    try {
        const { shop } = req.query;
        if (!shop) return res.status(400).json({ error: "Shop is required" });

        const targetSuffix = 'bookingsmodel';
        const targetNameLower = shop.toLowerCase() + targetSuffix;

        const availableModels = Object.keys(mongoose.models);
        let Model;
        const actualModelName = availableModels.find(m => m.toLowerCase() === targetNameLower);

        if (actualModelName) {
            Model = mongoose.models[actualModelName];
        } else {
            const fuzzyMatch = availableModels.find(m =>
                m.toLowerCase().startsWith(shop.toLowerCase()) &&
                m.toLowerCase().endsWith('bookingsmodel')
            );
            if (fuzzyMatch) Model = mongoose.models[fuzzyMatch];
        }

        if (!Model) {
            return res.status(404).json({ error: `Data model not found for ${shop}.` });
        }

        const actualsAgg = await Model.aggregate([
            {
                $addFields: {
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
                        month: { $month: "$dateObj" }
                    },
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const actuals = {};
        actualsAgg.forEach(item => {
            const y = item._id.year;
            const m = item._id.month - 1;
            if (!actuals[y]) actuals[y] = {};
            actuals[y][m] = item.total;
        });

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

module.exports = router;
