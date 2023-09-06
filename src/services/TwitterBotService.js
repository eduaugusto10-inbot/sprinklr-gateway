class TwitterBotService {
  async postMessage(body) {
    const instance = ""; //dados retorno do banco
    const setVarStr = "";
    const sessionId = "";

    let payloadSprinklr = {
      accountId: instance.account_id,
      content: {
        text: body.message,
      },
      taxonomy: {
        campaignId: instance.campaign_id,
      },
      inReplyToMessageId: user.message_id,
      toProfile: {
        channelType: instance.channel_type,
        channelId: user.channel_id,
        screenName: user.user_name,
      },
    };

    try {
      console.log(body);
    } catch (error) {}
  }
}

module.exports = {
  TwitterBotService,
};
