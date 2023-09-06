class TwitterService {
  async getMessage(body) {
    const instance = '';//dados retorno do banco
    const setVarStr = '';
    const sessionId = '';

    let payloadInbot = {
      bot_id: instance.bot_id,
      user_id: body.payload.senderProfile.channelId,
      bot_server_type: instance.bot_server_type,
      bot_token: instance.bot_token,
      channel: body.payload.channelType,
      user_phrase: body.payload.content.text,
      setvar: setVarStr,
      session_id: sessionId,
      url_webhook: instance.url_webhook
  };

    try {
      console.log(body);
    } catch (error) {}
  }
}

module.exports = {
  TwitterService,
};
