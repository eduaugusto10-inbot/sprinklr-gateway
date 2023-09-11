const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const utils = require('../utils')
class TwitterBotService {

  async postMessage(body, respInbot) {
    console.log('body')
    console.log(body.payload.messageId)
    const sprinklrInstance = new SprinklrInstanceDAO();
    const channelID = body.payload.receiverProfile.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0]
    console.log('retorno instance')
    const quickReply = utils.extractQuickReplies(respInbot.resp)
    console.log(quickReply)
    let buttons = []
    quickReply[1].map(v=>{
      buttons.push({
        title: v.title,
        subtitle: v.payload,
        "actionDetail": {
          "action": "TEXT"
      }
      })
    })
    let payloadSprinklr = {
      accountId: parseInt(instance.account_id),
      content: {
        text: quickReply[0],
      },
      taxonomy: {
        campaignId: instance.campaign_id,
      },
      inReplyToMessageId: body.payload.messageId,
      toProfile: {
        channelType: instance.channel_type,
        channelId: body.payload.senderProfile.channelId,
        screenName: body.payload.senderProfile.name,  
      },
    };
    if(quickReply[1].length>0){
      payloadSprinklr.content.attachment = {
        "type": "QUICK_REPLY",
        "message": "Escolha uma opção",
        "quickReplies": buttons
    }
  }
    console.log(JSON.stringify(payloadSprinklr))
    const headers = {headers:{
      "Key": "9ss9ydpek7enuch389up8z35",
      "Authorization": "Bearer P9+ewuw+Nid5hg4KBRNPGngd+m++5PNsBETNnrutBOE0MWIxZjc0Zi0xY2EwLTNjOTQtOTJlZi03OGRiMzc5OTZiOGE="
    }}
    const url_sprinklr = "https://api2.sprinklr.com/api/v2/publishing/message";
    try {
      axios
        .post(url_sprinklr, payloadSprinklr,headers)
        .then((response) => {
          console.log(response.data);
          return 200;
        })
        .catch((err) => {
          return err;
        });
      console.log(body);
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}

module.exports = {
  TwitterBotService,
};
