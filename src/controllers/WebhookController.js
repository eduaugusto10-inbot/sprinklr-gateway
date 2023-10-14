const { TwitterService } = require("../services/TwitterService");
const { InstagramService } = require("../services/InstagramService");

class WebhookController {
  async getMessage(req, res) {
    const channelType = req.body?.payload?.channelType
      ? req.body.payload.channelType
      : "";
    const twitterService = new TwitterService();
    const instagramService = new InstagramService();

    console.log(new Date(), `Rede social: ${req.body?.payload?.channelType}`);
    try {
      switch (channelType) {
        case "TWITTER":
          console.log(req.body)
          if (req.body.payload?.receiverProfile)
            twitterService.getMessage(req.body);
          break;
        case "INSTAGRAM":
          console.log(req.body);
          if (req.body.payload?.receiverProfile)
            instagramService.getMessage(req.body);
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
