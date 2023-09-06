const express = require("express");
const { WebhookController } = require("../controllers/WebhookController");

const router = express.Router();

router.get("/user", new WebhookController().getMessage);
router.post("/webhook", new WebhookController().getMessage);
router.post("/bot", new WebhookController().getMessage);

module.exports = router;
