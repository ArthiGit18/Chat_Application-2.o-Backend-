const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    required: true,
  },
  receiverEmail: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
