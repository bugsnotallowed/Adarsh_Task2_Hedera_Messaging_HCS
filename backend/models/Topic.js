// backend/models/Topic.js
const { Schema, model } = require('mongoose');

const TopicSchema = new Schema({
  topicId: { type: String, required: true, unique: true }, // e.g. "0.0.7268401"
  ownerAccountId: { type: String }, // owner who created the topic
  createdAt: { type: Date, default: Date.now },
  subscribers: [
    {
      subscriberId: String, // app level subscriber id or user id
      addedAt: { type: Date, default: Date.now },
    },
  ],
  meta: { type: Schema.Types.Mixed }, // any additional metadata
});

module.exports = model('Topic', TopicSchema);
