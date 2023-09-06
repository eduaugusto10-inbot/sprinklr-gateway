const { TwitterService } = require("../services/TwitterService");

class WebhookController {
  async getMessage(req, res) {
    const channelType = req.body.payload.channelType;
    const twitterService = new TwitterService();

    console.log(new Date(), `Rede social: ${req.body.payload.channelType}`);
    try {
      switch (channelType) {
        case "TWITTER":
          twitterService.getMessage(req.body);
          break;
        default:
          break;
      }
      res.sendStatus(200);
    } catch (error) {
      console.log(Date(), `Error: ${error}`);
    }
  }
}

module.exports = {
  WebhookController,
};
