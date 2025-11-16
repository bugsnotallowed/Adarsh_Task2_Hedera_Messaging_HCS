// backend/controllers/hederaController.js
require('dotenv').config();
const {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} = require('@hashgraph/sdk');

const hederaClient = require('../services/hederaClient');
const encryptService = require('../services/encryptService');
const mongo = require('../services/mongo');
const TopicModel = require('../models/Topic');
const MessageModel = require('../models/Message');
const { startSubscription, messagesCache } = require('../services/topicSubscriber');
const axios = require('axios');

exports.createTopic = async (req, res) => {
  try {
    await mongo.connect();
    const client = hederaClient();
    const tx = await new TopicCreateTransaction().execute(client);
    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId.toString();

    console.log('------------------------------ Create Topic ------------------------------ ');
    console.log('Receipt status           :', receipt.status.toString());
    console.log('Transaction ID           :', tx.transactionId.toString());
    console.log('Hashscan URL             :', 'https://hashscan.io/testnet/transaction/' + tx.transactionId.toString());
    console.log('Topic ID                 :', topicId);

    // Persist topic
    const owner = process.env.OPERATOR_ID || null;
    await TopicModel.updateOne(
      { topicId },
      { $setOnInsert: { topicId, ownerAccountId: owner } },
      { upsert: true }
    );

    // start background subscription (this function waits for mirror)
    setTimeout(() => startSubscription(topicId), 500);

    res.json({ topicId });
  } catch (err) {
    console.error('❌ createTopic error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { topicId, message } = req.body;
    if (!topicId || !message) return res.status(400).json({ error: 'topicId and message required' });

    const encrypted = encryptService.encrypt(message);
    const client = hederaClient();

    const tx = await new TopicMessageSubmitTransaction({
      topicId,
      message: encrypted,
    }).execute(client);

    const receipt = await tx.getReceipt(client);

    // store the sent message as well (sender is operator)
    await mongo.connect();
    const sentDoc = new MessageModel({
      topicId,
      encrypted,
      decrypted: message,
      senderId: process.env.OPERATOR_ID || 'server',
      timestamp: receipt.consensusTimestamp ? receipt.consensusTimestamp.toString() : new Date().toISOString(),
      sequenceNumber: null,
      receivedBySubscriber: false, // subscriber will later receive & mark/store; but we already store
    });
    await sentDoc.save();

    res.json({
      encryptedMessage: encrypted,
      timestamp: receipt.consensusTimestamp ? receipt.consensusTimestamp.toString() : new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ sendMessage error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Return persisted messages from MongoDB (ordered asc)
exports.getMessages = async (req, res) => {
  try {
    const { topicId } = req.params;
    await mongo.connect();

    const docs = await MessageModel.find({ topicId }).sort({ sequenceNumber: 1, createdAt: 1 }).lean();

    // map to expected format
    const messages = docs.map((d) => ({
      message: d.decrypted || d.encrypted,
      encrypted: d.encrypted,
      senderId: d.senderId,
      timestamp: d.timestamp,
      sequenceNumber: d.sequenceNumber,
    }));

    return res.json(messages);
  } catch (err) {
    console.error('❌ getMessages error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Subscribe endpoint (register subscriber and start subscription)
exports.subscribe = async (req, res) => {
  try {
    const { topicId, subscriberId } = req.body;
    if (!topicId) return res.status(400).json({ error: 'topicId required' });

    await mongo.connect();
    await TopicModel.updateOne({ topicId }, { $addToSet: { subscribers: { subscriberId } } }, { upsert: true });

    // start subscription in background
    startSubscription(topicId);

    res.json({ ok: true });
  } catch (err) {
    console.error('❌ subscribe error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch messages directly from the mirror node API and try to decode/decrypt them.
// Useful to fetch topics not yet subscribed or public topics.
exports.fetchMirrorMessages = async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!topicId) return res.status(400).json({ error: 'topicId required' });

    const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100`;

    const r = await axios.get(url);
    const msgs = (r.data && r.data.messages) || [];

    const parsed = msgs.map((m) => {
      // m.message is base64 string
      const encryptedBase64 = m.message;
      // convert base64 -> utf8 encrypted string
      const encryptedOriginal = Buffer.from(encryptedBase64, 'base64').toString('utf8');

      let decrypted = null;
      try {
        decrypted = encryptService.decrypt(encryptedOriginal);
      } catch (e) {
        // cannot decrypt (maybe different key) -> leave null
      }

      return {
        topicId: m.topic_id || topicId,
        sequenceNumber: m.sequence_number,
        encrypted: encryptedOriginal,
        decrypted,
        senderId: m.payer_account_id,
        timestamp: m.consensus_timestamp,
      };
    });

    return res.json(parsed);
  } catch (err) {
    console.error('❌ fetchMirrorMessages error:', err);
    res.status(500).json({ error: err.message });
  }
};
