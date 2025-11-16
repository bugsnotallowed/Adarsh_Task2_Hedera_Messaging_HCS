const axios = require("axios");
const { TopicMessageQuery } = require("@hashgraph/sdk");
const hederaClient = require("./hederaClient");
const encryptService = require("./encryptService");

const messagesCache = {};

async function waitForTopicInMirror(topicId) {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;

  console.log(`🔍 Checking mirror node for topic ${topicId}...`);

  for (let i = 0; i < 20; i++) {
    // retry for ~10 seconds
    try {
      const res = await axios.get(url);
      if (res.data && res.data.topic_id) {
        console.log(`✅ Mirror node indexed topic ${topicId}`);
        return true;
      }
    } catch (err) {
      // Topic not found yet — wait
    }

    console.log(`⏳ Topic ${topicId} not found in mirror. Retrying...`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`❌ Mirror node did not index topic ${topicId} in time.`);
  return false;
}

async function subscribeToTopic(topicId) {
  const client = hederaClient();

  console.log(`📡 Subscribing to topic ${topicId}`);

  messagesCache[topicId] = [];

  new TopicMessageQuery().setTopicId(topicId).subscribe(
    client,
    (msg) => {
      try {
        // Convert SDK bytes → base64 string
        const encryptedBase64 = Buffer.from(msg.contents).toString("base64");

        // Convert base64 → original encrypted text
        const encryptedOriginal = Buffer.from(
          encryptedBase64,
          "base64"
        ).toString("utf8");

        // Decrypt original
        const decrypted = encryptService.decrypt(encryptedOriginal);

        const entry = {
          message: decrypted,
          timestamp: msg.consensusTimestamp.toString(),
        };

        messagesCache[topicId].push(entry);
        console.log("📩 New message:", entry);
      } catch (err) {
        console.error("❌ Message decryption error:", err);
      }
    },
    (err) => {
      // Hedera SDK bug: sometimes TopicMessage is passed into error callback
      if (err instanceof Object && err.consensusTimestamp) {
        console.log(
          "⚠ SDK bug: TopicMessage incorrectly routed to onError(), ignoring."
        );
        return;
      }

      console.error("❌ Real subscriber error:", err);
    }
  );
}

module.exports = {
  messagesCache,

  async startSubscription(topicId) {
    // Only subscribe once
    if (messagesCache[topicId]) {
      console.log("ℹ️ Already subscribed to topic", topicId);
      return;
    }

    // WAIT until mirror has indexed topic
    const ready = await waitForTopicInMirror(topicId);
    if (!ready) {
      console.error(
        `❌ Cannot subscribe: topic ${topicId} never reached mirror.`
      );
      return;
    }

    // Subscribe AFTER mirror readiness
    await subscribeToTopic(topicId);
  },
};
