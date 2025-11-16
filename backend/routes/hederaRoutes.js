const express = require("express");
const router = express.Router();

const {
  createTopic,
  sendMessage,
  getMessages
} = require("../controllers/hederaController");

router.post("/topic", createTopic);
router.post("/message", sendMessage);
router.get("/messages/:topicId", getMessages);

module.exports = router;
