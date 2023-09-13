const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const utils = require('../utils')
class TwitterBotService {

  async postMessage(body, respInbot) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const channelID = body.payload.receiverProfile.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0]
    console.log('retorno instance')
    const extractTwitterTags = utils.extractTwitter(respInbot.resp)
    console.log(`Twitter retirado tags ${extractTwitterTags}`)
    let buttons = []
    extractTwitterTags?.quick_reply?.options.map(v=>{
      buttons.push({
        title: v.label,
        subtitle: v.metadata,
        "actionDetail": {
          "action": "TEXT"
      }
      })
    })
    let payloadSprinklr = {
      accountId: parseInt(instance.account_id),
      content: {
        text: extractTwitterTags.text,
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
    if(extractTwitterTags?.quick_reply?.options?.length>0){
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
          if(err.response.data.errors[0].message.includes("poucos minutos atrás"))
              this.repostMessage(payloadSprinklr)
          return err;
        });
      console.log(body);
    } catch (error) {
      console.error(error.response);
      return error;
    }
  }

  async repostMessage(payloadSprinklr) {
    let newMessage = payloadSprinklr.content.text;
    const randomNumber = Math.floor(Math.random() * 50)
    let counter = 1;
    while(counter<randomNumber){
      newMessage += " ";
      counter++;
    }
    payloadSprinklr.content.text = newMessage;
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
          if(err.response.data.errors[0].message.includes("poucos minutos atrás"))
          console.error(JSON.stringify(err.response.data.errors[0].message))
          return err;
        });
      console.log(body);
    } catch (error) {
      console.error(error.response);
      return error;
    }
  }
}


module.exports = {
  TwitterBotService,
};
