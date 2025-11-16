const {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
} = require("@hashgraph/sdk");

const hederaClient = require("../services/hederaClient");
const { startSubscription } = require("../services/topicSubscriber");
const encryptService = require("../services/encryptService");
const { messagesCache } = require("../services/topicSubscriber");

exports.createTopic = async (req, res) => {
  try {
    const client = hederaClient();
    const tx = await new TopicCreateTransaction().execute(client);
    const receipt = await tx.getReceipt(client);
    const txCreateTopicId = tx.transactionId.toString();
    const topicId = receipt.topicId.toString();

    console.log(
      "------------------------------ Create Topic ------------------------------ "
    );
    console.log("Receipt status           :", receipt.status.toString());
    console.log("Transaction ID           :", txCreateTopicId);
    console.log(
      "Hashscan URL             :",
      "https://hashscan.io/testnet/transaction/" + txCreateTopicId
    );
    console.log("Topic ID                 :", topicId);

    // FIX: Wait before subscribing (mirror node propagation delay)
    setTimeout(() => {
      startSubscription(topicId);
    }, 500);

    res.json({
      topicId: topicId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { topicId, message } = req.body;

    const encrypted = encryptService.encrypt(message);
    const client = hederaClient();

    const tx = await new TopicMessageSubmitTransaction({
      topicId,
      message: encrypted,
    }).execute(client);

    const receipt = await tx.getReceipt(client);

    res.json({
      encryptedMessage: encrypted,
      timestamp: receipt.consensusTimestamp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  const { topicId } = req.params;

  if (!messagesCache[topicId]) {
    return res.json([]); // No subscription yet
  }

  return res.json(messagesCache[topicId]);
};
