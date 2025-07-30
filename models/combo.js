const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema({
  topId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  bottomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Combo', comboSchema);
