/**
 * Receipt Numbering Routes - API endpoints for receipt sequence management
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

const adminOnly = authorize(['admin']);

router.get('/number/next', authenticate, async (req, res) => {
  try {
    const { sequenceId } = req.query;
    const receiptNumber = await numberingService.generateReceiptNumber(
      sequenceId || 'default'
    );

    res.json({
      success: true,
      receiptNumber,
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt number',
      error: error.message,
    });
  }
});

router.get('/number/current', authenticate, (req, res) => {
  try {
    const { sequenceId } = req.query;
    const receiptNumber = numberingService.getCurrentReceiptNumber(sequenceId || 'default');

    res.json({
      success: true,
      receiptNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get current receipt number',
      error: error.message,
    });
  }
});

router.get('/number/preview', authenticate, (req, res) => {
  try {
    const { sequenceId } = req.query;
    const nextReceiptNumber = numberingService.getNextReceiptNumberPreview(
      sequenceId || 'default'
    );

    res.json({
      success: true,
      nextReceiptNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to preview next receipt number',
      error: error.message,
    });
  }
});

router.get('/sequences', authenticate, adminOnly, (req, res) => {
  try {
    const sequences = numberingService.getAllSequences();

    res.json({
      success: true,
      count: sequences.length,
      sequences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sequences',
      error: error.message,
    });
  }
});

router.get('/sequences/:sequenceId', authenticate, adminOnly, (req, res) => {
  try {
    const { sequenceId } = req.params;
    const sequence = numberingService.getSequence(sequenceId);

    res.json({
      success: true,
      sequence,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sequence',
      error: error.message,
    });
  }
});

router.post('/sequences', authenticate, adminOnly, async (req, res) => {
  try {
    const {
      name,
      prefix,
      startNumber,
      maxNumber,
      zeroPadding,
      format,
    } = req.body;

    if (!name || !prefix) {
      return res.status(400).json({
        success: false,
        message: 'Sequence name and prefix are required',
      });
    }

    const result = await numberingService.createSequence({
      name,
      prefix,
      startNumber: startNumber || 1000,
      maxNumber: maxNumber || 999999,
      zeroPadding: zeroPadding || 6,
      format,
      createdBy: req.user.id,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create sequence',
      error: error.message,
    });
  }
});

router.post('/sequences/:sequenceId/reset', authenticate, adminOnly, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const result = await numberingService.resetSequence(sequenceId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset sequence',
      error: error.message,
    });
  }
});

router.post('/sequences/:sequenceId/deactivate', authenticate, adminOnly, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const result = await numberingService.deactivateSequence(sequenceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate sequence',
      error: error.message,
    });
  }
});

router.post('/sequences/:sequenceId/activate', authenticate, adminOnly, async (req, res) => {
  try {
    const { sequenceId } = req.params;
    const result = await numberingService.activateSequence(sequenceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to activate sequence',
      error: error.message,
    });
  }
});

router.get('/sequences/:sequenceId/stats', authenticate, adminOnly, (req, res) => {
  try {
    const { sequenceId } = req.params;
    const stats = numberingService.getSequenceStats(sequenceId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sequence statistics',
      error: error.message,
    });
  }
});

module.exports = router;
