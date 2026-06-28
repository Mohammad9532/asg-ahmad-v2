const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ExpenseMaster } = require('../models/ExpenseMaster');

// GET all active master items
router.get('/master/expenses', authenticateToken, async (req, res) => {
    try {
        const items = await ExpenseMaster.find({ isActive: true }).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        console.error("Master Expenses List Error:", err);
        res.status(500).json({ error: "Failed to fetch master expenses." });
    }
});

// POST a new master item
router.post('/master/expenses', authenticateToken, async (req, res) => {
    try {
        const { targetId, name, type, department, category } = req.body;
        
        if (!targetId || !name || !type || !department || !category) {
            return res.status(400).json({ error: "All fields are required." });
        }

        const existing = await ExpenseMaster.findOne({ targetId: targetId.trim() });
        if (existing) {
            return res.status(400).json({ error: `Target ID ${targetId} already exists.` });
        }

        const newItem = new ExpenseMaster({
            targetId: targetId.trim(),
            name: name.trim(),
            type: type.trim().toLowerCase(),
            department: department.trim(),
            category: category.trim()
        });

        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) {
        console.error("Create Master Expense Error:", err);
        res.status(500).json({ error: "Failed to create master expense." });
    }
});

// PUT to update or deactivate a master item
router.put('/master/expenses/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, category, isActive } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (department) updateData.department = department.trim();
        if (category) updateData.category = category.trim();
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedItem = await ExpenseMaster.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        
        if (!updatedItem) {
            return res.status(404).json({ error: "Master expense item not found." });
        }

        res.json(updatedItem);
    } catch (err) {
        console.error("Update Master Expense Error:", err);
        res.status(500).json({ error: "Failed to update master expense." });
    }
});

module.exports = router;
