// backend/models/Message.js
const { Schema, model } = require('mongoose');

const MessageSchema = new Schema({
  topicId: { type: String, required: true, index: true },
  encrypted: { type: String, required: true }, // encrypted text (stored as string)
  decrypted: { type: String, default: null }, // decrypted text (if we can)
  senderId: { type: String, default: null }, // Hedera account that submitted tx
  timestamp: { type: String }, // store consensusTimestamp as string (SDK returns string)
  sequenceNumber: { type: Number },
  createdAt: { type: Date, default: Date.now },
  // optional flags
  receivedBySubscriber: { type: Boolean, default: true }, // true when received by our subscriber
});

MessageSchema.index({ topicId: 1, sequenceNumber: 1 });

module.exports = model('Message', MessageSchema);
