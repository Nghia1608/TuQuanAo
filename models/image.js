const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: String,
  url: String,
  type: String, // 'áo', 'quần', 'váy'...
  color: String
});

module.exports = mongoose.model('Image', imageSchema);
