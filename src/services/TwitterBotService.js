const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const utils = require('../utils')
const Promise = require('bluebird');
class TwitterBotService {

  async sendMessage(payloadSprinklr){
    console.log(JSON.stringify(payloadSprinklr))
    const url_sprinklr = "https://api2.sprinklr.com/api/v2/publishing/message";
    const headers = {headers:{
      "Key": "9ss9ydpek7enuch389up8z35",
      "Authorization": "Bearer P9+ewuw+Nid5hg4KBRNPGngd+m++5PNsBETNnrutBOE0MWIxZjc0Zi0xY2EwLTNjOTQtOTJlZi03OGRiMzc5OTZiOGE="
    }}
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

  async postMessage(body, respInbot) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const channelID = body.payload.receiverProfile.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0]
    console.log('retorno instance')
    const extractTwitterTags = utils.extractTwitter(respInbot.resp)
    console.log(`Twitter retirado tags ${JSON.stringify(extractTwitterTags)}`)
    const textBlocks = utils.separarBlocos(extractTwitterTags.text)
    console.log(`textBlocks ${JSON.stringify(textBlocks)}`)
    if(extractTwitterTags?.quick_reply?.options.length > 0){
      textBlocks[textBlocks.length - 1].last = true
    }

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
    for(const bloco of textBlocks){
      if (bloco.delay > 0)
      await Promise.delay(bloco.delay * 1000);

      let payloadSprinklr = {
        accountId: parseInt(instance.account_id),
        content: {
          text: bloco.bloco,
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
      if(bloco.last){
        if(extractTwitterTags?.quick_reply?.options?.length>0){
          payloadSprinklr.content.text = bloco.bloco !== ' ' ? bloco.bloco : "Escolha uma opção";
          payloadSprinklr.content.attachment = {
            "type": "QUICK_REPLY",
            "message": "Escolha uma opção",
            "quickReplies": buttons
          }
        }
      } 
      console.log(`Envio do texto: ${JSON.stringify(payloadSprinklr)}`)
      this.sendMessage(payloadSprinklr)
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
