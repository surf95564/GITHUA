const express = require('express');
const router = express.Router();
const Receipt = require('../models/Receipt');
const AdminSettings = require('../models/AdminSettings');

// Generate unique receipt number
const generateReceiptNumber = async () => {
  const count = await Receipt.countDocuments();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `RCP-${year}-${month}-${String(count + 1).padStart(5, '0')}`;
};

// Create a new receipt
router.post('/', async (req, res) => {
  try {
    const {
      houseNumber,
      occupantName,
      guardFee,
      garbageFee,
      water,
      payment,
    } = req.body;

    // Get house rent from admin settings
    const adminSettings = await AdminSettings.findOne();
    const house = adminSettings?.houses.find((h) => h.houseNumber === houseNumber);

    if (!house) {
      return res.status(404).json({ error: 'House not found in settings' });
    }

    const receiptNumber = await generateReceiptNumber();

    const receipt = new Receipt({
      receiptNumber,
      houseNumber,
      occupantName,
      rent: {
        amount: house.rentAmount,
      },
      guardFee,
      garbageFee,
      water,
      payment,
    });

    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get receipt by ID
router.get('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update receipt
router.put('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get admin settings
router.get('/settings/config', async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update admin settings
router.put('/settings/config', async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;