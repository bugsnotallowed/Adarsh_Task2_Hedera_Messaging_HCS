// backend/services/topicSubscriber.js
const axios = require('axios');
const { TopicMessageQuery } = require('@hashgraph/sdk');
const hederaClient = require('./hederaClient');
const encryptService = require('./encryptService');
const mongo = require('./mongo');

const TopicModel = require('../models/Topic');
const MessageModel = require('../models/Message');

const messagesCache = {}; // in-memory cache (optional fast read)

async function waitForTopicInMirror(topicId, timeoutMs = 15000) {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}`;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url);
      if (res.data && (res.data.topic_id || res.status === 200)) {
        return true;
      }
    } catch (err) {
      // ignore - not indexed yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function subscribeToTopic(topicId) {
  const client = hederaClient();

  if (!messagesCache[topicId]) messagesCache[topicId] = [];

  console.log(`📡 Subscribing to topic ${topicId} (background)`);

  new TopicMessageQuery()
    .setTopicId(topicId)
    .subscribe(
      client,
      async (msg) => {
        try {
          // 1) turn SDK bytes -> base64 string
          const encryptedBase64 = Buffer.from(msg.contents).toString('base64');

          // 2) base64 -> original encrypted utf8 string
          const encryptedOriginal = Buffer.from(encryptedBase64, 'base64').toString('utf8');

          // 3) attempt decrypt (if AES key is correct)
          let decrypted = null;
          try {
            decrypted = encryptService.decrypt(encryptedOriginal);
          } catch (e) {
            // decryption may fail if message not encrypted by our key; that's okay
          }

          const senderAcc =
            msg.initialTransactionId &&
            msg.initialTransactionId.accountId &&
            msg.initialTransactionId.accountId.toString
              ? msg.initialTransactionId.accountId.toString()
              : null;

          const sequenceNumber = msg.sequenceNumber ? Number(msg.sequenceNumber.toString()) : null;
          const consensusTimestamp = msg.consensusTimestamp ? msg.consensusTimestamp.toString() : new Date().toISOString();

          // Save to MongoDB
          try {
            await mongo.connect(); // ensure connection
            const messageDoc = new MessageModel({
              topicId,
              encrypted: encryptedOriginal,
              decrypted,
              senderId: senderAcc,
              timestamp: consensusTimestamp,
              sequenceNumber,
              receivedBySubscriber: true,
            });
            await messageDoc.save();
          } catch (dbErr) {
            console.error('❌ DB save error for message:', dbErr);
          }

          // Update in-memory cache (fast read)
          messagesCache[topicId].push({
            message: decrypted || encryptedOriginal,
            encrypted: encryptedOriginal,
            senderId: senderAcc,
            timestamp: consensusTimestamp,
            sequenceNumber,
          });

          // Update Topic's subscribers list (if sender present)
          if (senderAcc) {
            try {
              await TopicModel.updateOne(
                { topicId },
                { $addToSet: { subscribers: { subscriberId: senderAcc } } }
              );
            } catch (err) {
              console.error('❌ Error updating Topic subscribers:', err);
            }
          }

          console.log('📩 New message cached + persisted:', {
            topicId,
            sender: senderAcc,
            ts: consensusTimestamp,
          });
        } catch (err) {
          console.error('❌ Message handler error:', err);
        }
      },
      (err) => {
        // SDK bug: sometimes TopicMessage arrives in error handler — handle gracefully
        if (err && err.consensusTimestamp) {
          console.warn('⚠ SDK quirk: TopicMessage in error handler, ignoring.');
          return;
        }
        console.error('❌ Subscriber error:', err);
      }
    );
}

module.exports = {
  messagesCache,

  async startSubscription(topicId) {
    if (messagesCache[topicId]) {
      console.log('ℹ️ Already subscribed to topic', topicId);
      return;
    }

    const ready = await waitForTopicInMirror(topicId, 15000);
    if (!ready) {
      console.error(`❌ Mirror node did not index topic ${topicId} in time.`);
      return;
    }

    // ensure messagesCache exists
    messagesCache[topicId] = [];

    // Start subscription
    subscribeToTopic(topicId);
  },
};
