const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const utils = require('../utils')
const Promise = require('bluebird');
class InstagramBotService {

  async sendMessage(payloadSprinklr){
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
    console.log(`retorno instance ${JSON.stringify(respInbot)}`)
    // const extractInstagramTags = utils.extractTwitter(respInbot.resp)
    // console.log(`Instagram retirado tags ${JSON.stringify(extractInstagramTags)}`)
    const textBlocks = utils.separarBlocos(respInbot.resp)
    // const textBlocks = utils.separarBlocos(extractInstagramTags.text)
    const [botReply, replies] = utils.extractQuickReplies(respInbot.resp)
    console.log(`textBlocks ${JSON.stringify(replies)}`)
    if(replies.length > 0){
      textBlocks[textBlocks.length - 1].last = true
    }

    let buttons = []
    replies.map(v=>{
      buttons.push({
        title: v.title,
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
        console.log("Entrou aqui")
        if(replies.length>0){
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
  InstagramBotService,
};
