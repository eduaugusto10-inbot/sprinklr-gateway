const express = require("express");
const { WebhookController } = require("../controllers/WebhookController");
const { MessageReceive } = require("../controllers/MessageReceive");

const router = express.Router();

router.get("/user", new WebhookController().getMessage);
router.post("/webhook", new WebhookController().getMessage);
router.post("/bot", new MessageReceive().getMessage); 
router.get("/bot", new MessageReceive().getMessage);

module.exports = router;
