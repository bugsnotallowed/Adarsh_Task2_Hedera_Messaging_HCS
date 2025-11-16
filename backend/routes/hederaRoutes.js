// backend/routes/hederaRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/hederaController');

router.post('/topic', controller.createTopic);
router.post('/message', controller.sendMessage);
router.get('/messages/:topicId', controller.getMessages);
router.post('/subscribe', controller.subscribe);
router.get('/fetch/:topicId', controller.fetchMirrorMessages);

module.exports = router;
