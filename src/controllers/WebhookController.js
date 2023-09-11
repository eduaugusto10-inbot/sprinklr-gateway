const { TwitterService } = require("../services/TwitterService");

class WebhookController {
  async getMessage(req, res) {
    console.log(req.body)
    const channelType = req.body?.payload?.channelType
      ? req.body.payload.channelType
      : "";
    const twitterService = new TwitterService();

    console.log(new Date(), `Rede social: ${req.body?.payload?.channelType}`);
    try {
      switch (channelType) {
        case "TWITTER":
          if(req.body.payload?.receiverProfile)
            twitterService.getMessage(req.body);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(Date(), `Error: ${error}`);
    } finally {
      res.sendStatus(200);
    }
  }
}

module.exports = {
  WebhookController,
};
