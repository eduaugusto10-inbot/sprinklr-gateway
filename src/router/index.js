const express = require("express");
const { WebhookController } = require("../controllers/WebhookController");
const { MessageReceive } = require("../controllers/MessageReceive");
const version = require("../services/Version");

const router = express.Router();

router.get("/user", new WebhookController().getMessage);
router.post("/webhook", new WebhookController().getMessage);
router.post("/bot", new MessageReceive().getMessage); 
router.get("/bot", new MessageReceive().getMessage);
router.get("/version",(req, res, next) => {
    console.log(new Date(), 'Version request received', version);
    res.send({ version: version.num });
    next();
});

module.exports = router;
