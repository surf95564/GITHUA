const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  houses: [
    {
      houseNumber: {
        type: String,
        required: true,
        unique: true,
      },
      rentAmount: {
        type: Number,
        required: true,
      },
    },
  ],
  guardFeeOptions: [
    {
      label: String,
      value: Number,
    },
  ],
  garbageFeeOptions: [
    {
      label: String,
      value: Number,
    },
  ],
  waterRate: {
    type: Number,
    default: 0,
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

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);