const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true,
  },
  houseNumber: {
    type: String,
    required: true,
  },
  occupantName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  rent: {
    amount: {
      type: Number,
      required: true,
    },
  },
  guardFee: {
    type: Number,
    default: 0,
  },
  garbageFee: {
    type: Number,
    default: 0,
  },
  water: {
    previousReading: {
      type: Number,
      required: true,
    },
    currentReading: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    unitsConsumed: {
      type: Number,
    },
    amount: {
      type: Number,
    },
  },
  payment: {
    totalReceived: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ['cash', 'mpesa', 'bank'],
      required: true,
    },
    transactionId: {
      type: String,
    },
    transactionDate: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate water units and amount before saving
receiptSchema.pre('save', function (next) {
  if (this.water.currentReading && this.water.previousReading) {
    this.water.unitsConsumed = this.water.currentReading - this.water.previousReading;
    this.water.amount = this.water.unitsConsumed * this.water.rate;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);