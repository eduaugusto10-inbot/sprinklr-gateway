const { TwitterService } = require("../services/TwitterService");
const { InstagramService } = require("../services/InstagramService");

class WebhookController {
  async getMessage(req, res) {
    console.log(
      new Date(),
      `[getMessage] Rede social: ${JSON.stringify(req.body)}`
    );
    const channelType = req.body?.payload?.uCase?.contact?.channelType
      ? req.body.payload.uCase.contact.channelType
      : req?.body?.payload?.contact?.channelType;
    if (!channelType) {
      return;
    }
    const twitterService = new TwitterService();
    const instagramService = new InstagramService();

    try {
      switch (channelType) {
        case "TWITTER":
          if (req.body.payload?.receiverProfile)
            twitterService.getMessage(req.body);
          break;
        case "INSTAGRAM":
          instagramService.getMessage(req.body);
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(Date(), `Error: ${error}`);
    } finally {
      res.send({
        status: "success",
        message: "Message received",
      });
    }
  }
}

module.exports = {
  WebhookController,
};
