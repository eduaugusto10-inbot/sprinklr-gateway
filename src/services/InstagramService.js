const { default: axios } = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const { SprinklrStateDAO } = require("../models/SprinklrStateDAO");
const utils = require("../utils");
const { InstagramBotService } = require("./InstagramBotService");
const FormData = require("form-data");
const inbotService = require("./InbotService");
// Se não houver receiverProfile a comunicação realizada não foi via messages, tenho que ignorar
class InstagramService {
  async getMessage(body) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const sprinklrState = new SprinklrStateDAO();
    const instagramBotService = new InstagramBotService();
    const lastMessage = await utils.lastMessage(
      body.payload.uCase.firstMessageId,
      body.payload.uCase.latestMessageAssociatedTime
    );
    console.log(
      new Date(),
      `[getMessage]Last message: ${JSON.stringify(lastMessage)}`
    );
    if (lastMessage == undefined) {
      return "Nenhuma mensagem para enviar";
    }

    const channelID = lastMessage.receiverProfile.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0];
    console.log(new Date(), `Instance data ${JSON.stringify(instance)}`);
    if (instance === undefined) {
      console.log(new Date(), `Bot ${channelID} não cadastrado`);
      return "Bot não cadastrado";
    }
    let checkControl = [];
    if (body.type == "message.association.change") {
      checkControl = await utils.checkControl(body.payload.uCase.id);
      if (
        checkControl.data.controllingParticipantId != instance.participant_id
      ) {
        return "Conversa esta com outro participante";
      }
    }
    console.log(
      new Date(),
      `Controle participant ${JSON.stringify(checkControl)}`
    );

    const setVarStr = `full_name=${lastMessage.senderProfile.name}`;
    // Verifica se usuario existe, caso nao cadastra
    const dbUserState = await sprinklrState.getStateByUserId(
      lastMessage.senderProfile.channelId,
      instance.bot_id
    );
    // console.log(new Date(), `Usuario: ${JSON.stringify(dbUserState)}`)
    const dbUser = await this.createOrRetrieveState(
      dbUserState,
      instance,
      body
    );
    const sessionId = dbUser.session_id;
    let payloadInbot = {
      bot_id: instance.bot_id,
      user_id: lastMessage.senderProfile.channelId,
      bot_server_type: instance.bot_server_type,
      bot_token: instance.bot_token,
      channel: "instagram-sprinklr", //body.payload.channelType,
      setvar: setVarStr,
      session_id: sessionId,
      url_webhook: instance.url_webhook,
    };

    if (utils.isHasOwnProperty(lastMessage.content, "text")) {
      payloadInbot.user_phrase = lastMessage.content.text;
    } else {
      // Envio de arquivos
      var data = new FormData();
      // console.log(new Date(), `Attachment: ${body.payload.content.attachment}`)
      data.append("file-upload-anexo", lastMessage.content.attachment.url);
      data.append("action", "file-upload");
      data.append("bot_id", instance.bot_id);
      data.append("bot_token", instance.bot_token);
      data.append("mime_type", lastMessage.content.attachment.type);
      data.append("folder", "user-files");
      data.append("session_id", sessionId);
      data.append("user_id", lastMessage.senderProfile.channelId);
      data.append("channel", lastMessage.channelType + "-sprinklr");
      data.append("USER_PHONE", lastMessage.senderProfile.channelId);
      const uploadFile = await inbotService.postFile(data);
      console.log(new Date(), `AFTER_UPLOAD: ${JSON.stringify(uploadFile)}`);
      if (lastMessage.content.attachment.type == "AUDIO") {
        payloadInbot.user_phrase = await utils.speechToText(uploadFile.url);
      } else {
        payloadInbot.user_phrase =
          "AFTER_UPLOAD " +
          uploadFile.url +
          " mime_type=" +
          lastMessage.content.attachment.type;
      }
    }

    console.log(payloadInbot);
    try {
      await axios.post(instance.url_bot, payloadInbot).then((resp) => {
        console.log(new Date(), `Inbot: ${JSON.stringify(resp.data)}`);
        instagramBotService.postMessage(lastMessage, resp.data, body);
      });
      // console.log(body);
    } catch (error) {}
  }

  async createOrRetrieveState(dbUserState, instance, userData) {
    if (!dbUserState || dbUserState.length === 0) {
      return await this.createNewState(instance, userData);
    } else {
      const resp = await this.recreateSessionIfNecessary(instance, dbUserState);
      // console.log(new Date(), `dbUserState: ${JSON.stringify(resp)}`)
      return resp;
    }
  }

  async createNewState(instance, userData) {
    const sprinklrState = new SprinklrStateDAO();
    const sessionId = utils.sessionGenerator(32);
    const channelId = this.findChannelId(userData);
    if (!channelId) {
      return;
    }
    const conversationId = userData.payload.conversationId;
    const messageId = userData.payload.messageId;
    try {
      const user = await sprinklrState.createState(
        sessionId,
        instance.bot_id,
        channelId,
        channelId,
        0,
        conversationId,
        messageId
      );
      // console.log(new Date(), `Usuario criado: ${JSON.stringify(user)}`)
      return user;
    } catch (error) {
      console.log(error);
    }
  }

  async recreateSessionIfNecessary(instance, dbUserState) {
    const sprinklrState = new SprinklrStateDAO();
    const now = new Date();
    let lastInteraction = new Date(dbUserState.last_interaction);
    lastInteraction = lastInteraction.setMinutes(
      lastInteraction.getMinutes() + 30
    );
    lastInteraction = new Date(lastInteraction);
    if (now > lastInteraction) {
      const sessionId = utils.sessionGenerator(32);
      try {
        await sprinklrState.updateUserSessionState(
          dbUserState.user_name,
          instance.bot_id,
          sessionId
        );
        const response = await sprinklrState.getStateByUserId(
          dbUserState.user_name,
          instance.bot_id
        );
        return response;
      } catch (error) {}
    } else {
      await sprinklrState.updateUserState(
        dbUserState.user_name,
        instance.bot_id
      );
      const response = await sprinklrState.getStateByUserId(
        dbUserState.user_name,
        instance.bot_id
      );
      return response;
    }
  }

  findChannelId(userData) {
    if (userData?.payload?.senderProfile) {
      return userData.payload.senderProfile.channelId;
    } else if (userData?.payload?.uCase?.contact?.channelId) {
      return userData.payload.uCase.contact.channelId;
    }
    return null;
  }
}

module.exports = {
  InstagramService,
};
