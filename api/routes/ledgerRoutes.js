const express = require('express');
const mongoose = require('mongoose');
const { LedgerSettings, LedgerAdjustment } = require('../models/Ledger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Route to Set/Update Ledger Settings (Initial Balance)
 * POST /api/:shop/ledger/settings
 */
router.post('/:shop/ledger/settings', async (req, res) => {
    try {
        const { shop } = req.params;
        const { initialBalance, startDate } = req.body;

        if (initialBalance === undefined || !startDate) {
            return res.status(400).json({ error: "initialBalance and startDate are required." });
        }

        const settings = await LedgerSettings.findOneAndUpdate(
            { shop },
            { initialBalance: Number(initialBalance), startDate: new Date(startDate) },
            { upsert: true, new: true }
        );

        res.json(settings);
    } catch (err) {
        console.error("Ledger Settings Update Error:", err);
        res.status(500).json({ error: "Failed to update ledger settings." });
    }
});

/**
 * Route to Get Ledger Settings
 * GET /api/:shop/ledger/settings
 */
router.get('/:shop/ledger/settings', async (req, res) => {
    try {
        const { shop } = req.params;
        const settings = await LedgerSettings.findOne({ shop });
        res.json(settings || { initialBalance: 0, startDate: null });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch ledger settings." });
    }
});

/**
 * Route to record Daily Ledger Adjustment (Short/Extra)
 * POST /api/:shop/ledger/adjustment
 */
router.post('/:shop/ledger/adjustment', async (req, res) => {
    try {
        const { shop } = req.params;
        const { date, amount, note } = req.body;

        if (!date || amount === undefined) {
            return res.status(400).json({ error: "Date and amount are required." });
        }

        const adjustment = await LedgerAdjustment.findOneAndUpdate(
            { shop, date: new Date(date + 'T00:00:00.000Z') },
            { amount: Number(amount), note },
            { upsert: true, new: true }
        );

        res.json(adjustment);
    } catch (err) {
        console.error("Ledger Adjustment Update Error:", err);
        res.status(500).json({ error: "Failed to update ledger adjustment." });
    }
});

module.exports = router;
