const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const utils = require('../utils')
const Promise = require('bluebird');
class TwitterBotService {

  async sendMessage(payloadSprinklr){
    console.log(JSON.stringify(payloadSprinklr))
    const url_sprinklr = "https://api2.sprinklr.com/api/v2/publishing/message";
    const headers = {headers:{
      "Key": "265cez298wgp99eahsrk46cq",
      "Authorization": "Bearer DjBqzqEquhNKWj2x+ZcmtVKHAs/5Myhkfi23VQdTb48zYWJiMzUzZC0wMDMyLTM2YmMtYjE4NS05ZDdhNzdlZDhkYWI="
    }}
    try {
      axios
        .post(url_sprinklr, payloadSprinklr,headers)
        .then((response) => {
          console.log(response.data);
          return 200;
        })
        .catch((err) => {
          console.log(err.response.data)
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
    const extractTwitterTags = utils.extractTwitter(respInbot.resp)
    const msgParse = JSON.parse(extractTwitterTags);
    const textBlocks = utils.separarBlocos(msgParse.text)
    console.log(`textBlocks ${JSON.stringify(textBlocks)}`)
    if(msgParse?.quick_reply?.options.length > 0){
      textBlocks[textBlocks.length - 1].last = true
    }

    let buttons = []
    msgParse?.quick_reply?.options.map(v=>{
      buttons.push({
        title: v.label,
        subtitle: "",//v.metadata,
        "actionDetail": {
          "action": "TEXT"
      }
      })
    })
    for(const bloco of textBlocks){
      if (bloco.delay > 0)
      await Promise.delay(bloco.delay * 1000);
      const tagsHTMLWithText = utils.attachmentCreate(bloco.bloco);
      if(tagsHTMLWithText.length>0){
        payloadSprinklr.content.text = tagsHTMLWithText.text;
        payloadSprinklr.content.attachment = {
          "type": tagsHTMLWithText.mediaType,
          "url": tagsHTMLWithText.url
        }
      }
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
        console.log(`Bloco last ${JSON.stringify(bloco)}`)
        if(msgParse?.quick_reply?.options?.length>0){
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
      "Key": "265cez298wgp99eahsrk46cq",
      "Authorization": "Bearer DjBqzqEquhNKWj2x+ZcmtVKHAs/5Myhkfi23VQdTb48zYWJiMzUzZC0wMDMyLTM2YmMtYjE4NS05ZDdhNzdlZDhkYWI="
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
          console.error(JSON.stringify(err.response.data))
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
