const axios = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const { SprinklrCredentialsDAO } = require("../models/SprinklrCredentialsDAO");
const utils = require("../utils");
const Promise = require("bluebird");
class TwitterBotService {
  async sendMessage(payloadSprinklr) {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = await sprinklrCredentials.getCredentials(); //dados retorno do banco
    credentials = credentials[0];

    console.log(JSON.stringify(payloadSprinklr));
    const url_sprinklr = "https://api2.sprinklr.com/api/v2/publishing/message";
    const headers = {
      headers: {
        Key: credentials.client_id,
        Authorization: `Bearer ${credentials.token}`,
      },
    };
    try {
      axios
        .post(url_sprinklr, payloadSprinklr, headers)
        .then((response) => {
          console.log(response.data);
          return 200;
        })
        .catch((err) => {
          console.log(err.response.data);
          if (
            err.response.data.errors[0].message.includes("poucos minutos atrás")
          )
            this.repostMessage(payloadSprinklr);
          return err;
        });
      console.log(body);
    } catch (error) {
      console.error(error.response);
      return error;
    }
  }

  async postMessage(body, respInbot, messageAssociationChange) {
    const sprinklrInstance = new SprinklrInstanceDAO();

    const regex = /^([^_]*)/gi 
    const respRegex = messageAssociationChange.payload.uCase.conversationId.match(regex);
    const channelID = respRegex;

    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0];
    console.log(`Resp: ${JSON.stringify(respInbot.resp)}`);

    for (const bloco of respInbot.resp) {
      const extractTwitterTags = utils.extractTwitter(bloco.message);

      const quickReply = utils.extractQuickReplies(extractTwitterTags);

      let buttons = [];
      quickReply[1]?.map((v) => {
        buttons.push({
          title: v.title,
          subtitle: "", //v.metadata,
          actionDetail: {
            action: "TEXT",
          },
        });
      });

      if (bloco.delay > 0) await Promise.delay(bloco.delay * 1000);

      let payloadSprinklr = {
        accountId: parseInt(instance.account_id),
        content: {
          text: bloco.message,
        },
        taxonomy: {
          campaignId: instance.campaign_id,
        },
        inReplyToMessageId: body.messageId,
        toProfile: {
          channelType: instance.channel_type,
          channelId: body.senderProfile.channelId,
          screenName: body.senderProfile.name,
        },
      };

      if (bloco.media_type !== "") {
        payloadSprinklr.content.attachment = {
          type: bloco.media_type.toUpperCase(),
          url: bloco.media,
        };
      }

      if (buttons.length > 0) {
        payloadSprinklr.content.text = quickReply[0];
        payloadSprinklr.content.attachment = {
          type: "QUICK_REPLY",
          message: "Escolha uma opção",
          quickReplies: buttons,
        };
      }
      if(payloadSprinklr.content.text.includes("[CMD:HANDOVER]")){
        payloadSprinklr.content.text = bloco.message.replace("[CMD:HANDOVER]", "");
        const changeParticipantControl= await utils.changeParticipantControl(messageAssociationChange.payload.uCase.id);
        console.log(new Date(), `Change participant control: ${JSON.stringify(changeParticipantControl)}`)
      }
      console.log(`Envio do texto: ${JSON.stringify(payloadSprinklr)}`);
      this.sendMessage(payloadSprinklr);
    }
  }

  async repostMessage(payloadSprinklr) {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = await sprinklrCredentials.getCredentials(); //dados retorno do banco
    credentials = credentials[0];
    let newMessage = payloadSprinklr.content.text;
    const randomNumber = Math.floor(Math.random() * 50);
    let counter = 1;
    while (counter < randomNumber) {
      newMessage += " ";
      counter++;
    }
    payloadSprinklr.content.text = newMessage;
    const headers = {
      headers: {
        Key: credentials.client_id,
        Authorization: `Bearer ${credentials.token}`,
      },
    };
    const url_sprinklr = "https://api2.sprinklr.com/api/v2/publishing/message";
    try {
      axios
        .post(url_sprinklr, payloadSprinklr, headers)
        .then((response) => {
          console.log(response.data);
          return 200;
        })
        .catch((err) => {
          console.error(JSON.stringify(err.response.data));
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
