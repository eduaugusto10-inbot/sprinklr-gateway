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
    body.type == "message.created"
      ? this.getMessageCreate(body)
      : this.getCaseCreate(body);
  }
  async getMessageCreate(body) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const sprinklrState = new SprinklrStateDAO();
    const instagramBotService = new InstagramBotService();
    const channelID = body?.payload?.receiverProfile?.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0];
    if (instance === undefined) {
      return "Bot não cadastrado";
    }
    console.log(
      new Date(),
      `[getMessageCreate] Rede social: ${JSON.stringify(body)}`
    );
    let checkControl = [];
    if (body.type == "message.association.change") {
      checkControl = await utils.checkControl(body.payload.id);
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

    const setVarStr = `full_name=${body.payload.senderProfile.name}`;
    // Verifica se usuario existe, caso nao cadastra
    const fromSnUserId = body.payload.senderProfile.channelId;
    const dbUserState = await sprinklrState.getStateByFromSnUserId(
      fromSnUserId,
      instance.bot_id
    );
    if (dbUserState && dbUserState.send_to_inchat == 1) {
      return;
    }
    const dbUser = await this.createOrRetrieveState(
      dbUserState,
      instance,
      body
    );
    const sessionId = dbUser.session_id;
    let payloadInbot = {
      bot_id: instance.bot_id,
      user_id: body.payload.senderProfile.channelId,
      bot_server_type: instance.bot_server_type,
      bot_token: instance.bot_token,
      channel: "instagram-sprinklr", //body.payload.channelType,
      setvar: setVarStr,
      session_id: sessionId,
      url_webhook: instance.url_webhook,
    };

    if (utils.isHasOwnProperty(body.payload.content, "text")) {
      payloadInbot.user_phrase = body.payload.content.text;
    } else {
      // Envio de arquivos
      var data = new FormData();
      // console.log(new Date(), `Attachment: ${body.payload.content.attachment}`)
      data.append("file-upload-anexo", body.payload.content.attachment.url);
      data.append("action", "file-upload");
      data.append("bot_id", instance.bot_id);
      data.append("bot_token", instance.bot_token);
      data.append("mime_type", body.payload.content.attachment.type);
      data.append("folder", "user-files");
      data.append("session_id", sessionId);
      data.append("user_id", body.payload.senderProfile.channelId);
      data.append("channel", body.payload.channelType + "-sprinklr");
      data.append("USER_PHONE", body.payload.senderProfile.channelId);
      const uploadFile = await inbotService.postFile(data);
      console.log(new Date(), `AFTER_UPLOAD: ${JSON.stringify(uploadFile)}`);
      if (body.payload.content.attachment.type == "AUDIO") {
        payloadInbot.user_phrase = await utils.speechToText(uploadFile.url);
      } else {
        payloadInbot.user_phrase =
          "AFTER_UPLOAD " +
          uploadFile.url +
          " mime_type=" +
          body.payload.content.attachment.type;
      }
    }

    console.log(payloadInbot);
    try {
      await axios.post(instance.url_bot, payloadInbot).then((resp) => {
        console.log(new Date(), `Inbot: ${JSON.stringify(resp.data)}`);
        instagramBotService.postMessage(body.payload, resp.data, body);
      });
      // console.log(body);
    } catch (error) {}
  }
  async getCaseCreate(body) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const sprinklrState = new SprinklrStateDAO();
    const instagramBotService = new InstagramBotService();

    // Identificar o fromSnUserId baseado no tipo de payload
    let fromSnUserId, caseId, userName, channelId;

    if (body.type === "case.create") {
      // Para case.create
      fromSnUserId = body?.payload?.contact?.fromSnUserId;
      caseId = body?.payload?.caseNumber;
      userName = body?.payload?.contact?.name;
      channelId = body?.payload?.contact?.channelId;
    } else {
      // Para message.created
      fromSnUserId = body?.payload?.senderProfile?.channelId;
      caseId = body?.payload?.caseNumber;
      userName = body?.payload?.senderProfile?.name;
      channelId = body?.payload?.receiverProfile?.channelId;
    }

    if (!fromSnUserId) {
      console.log(new Date(), `fromSnUserId não encontrado no payload`);
      return "fromSnUserId não encontrado";
    }

    console.log(new Date(), `[getCaseCreate] Payload: ${JSON.stringify(body)}`);

    let instance;
    let dbUserState;

    if (body.type === "case.create") {
      // Para case.create: primeiro buscar usuário pelo fromSnUserId
      // e depois buscar o bot pelo channel_id do usuário
      console.log(
        new Date(),
        `Buscando usuário pelo fromSnUserId: ${fromSnUserId}`
      );

      // Buscar em todas as instâncias possíveis
      const allInstances = await sprinklrInstance.getAllInstances();
      let foundUser = null;

      for (const inst of allInstances) {
        const userState = await sprinklrState.getStateByFromSnUserId(
          fromSnUserId,
          inst.bot_id
        );
        if (userState) {
          foundUser = userState;
          instance = inst;
          break;
        }
      }

      if (foundUser) {
        dbUserState = foundUser;
        console.log(
          new Date(),
          `Usuário encontrado, usando bot_id: ${instance.bot_id}`
        );
      } else {
        // Se não encontrar o usuário, buscar pelo sourceId da última mensagem
        console.log(
          new Date(),
          `Usuário não encontrado, buscando pela última mensagem`
        );
        const lastMessage = await utils.lastMessage(
          body?.payload?.firstMessageId,
          body?.payload?.latestMessageAssociatedTime
        );
        if (lastMessage && lastMessage.sourceId) {
          console.log(
            new Date(),
            `Buscando bot pelo sourceId: ${lastMessage.sourceId}`
          );
          instance = await sprinklrInstance.getInstanceBySourceID(
            lastMessage.sourceId
          );
          instance = instance[0];
        }

        if (!instance) {
          console.log(
            new Date(),
            `Tentando buscar bot pelo channelId: ${channelId}`
          );
          instance = await sprinklrInstance.getInstanceByChannelID(channelId);
          instance = instance[0];
        }
      }
    } else {
      // Para message.created: buscar instância pelo channelId do receptor/bot
      instance = await sprinklrInstance.getInstanceByChannelID(channelId);
      instance = instance[0];

      if (instance) {
        // Buscar usuário pelo fromSnUserId
        dbUserState = await sprinklrState.getStateByFromSnUserId(
          fromSnUserId,
          instance.bot_id
        );
      }
    }

    if (instance === undefined) {
      console.log(
        new Date(),
        `Bot não cadastrado para channelId: ${channelId}`
      );
      return "Bot não cadastrado";
    }

    console.log(new Date(), `Instance data ${JSON.stringify(instance)}`);

    // Se ainda não temos o usuário, buscar agora que temos a instância
    if (!dbUserState && instance) {
      console.log(
        new Date(),
        `Buscando usuário pelo fromSnUserId: ${fromSnUserId} e bot_id: ${instance.bot_id}`
      );
      dbUserState = await sprinklrState.getStateByFromSnUserId(
        fromSnUserId,
        instance.bot_id
      );
    }

    console.log(
      new Date(),
      `Usuario encontrado: ${JSON.stringify(dbUserState)}`
    );

    let dbUser;
    if (dbUserState) {
      // Usuário encontrado, atualizar caseId se fornecido
      if (caseId) {
        await sprinklrState.updateUserCaseId(
          fromSnUserId,
          instance.bot_id,
          caseId
        );
        console.log(
          new Date(),
          `CaseId ${caseId} atualizado para o usuário ${fromSnUserId}`
        );
      }

      // Buscar usuário atualizado
      dbUser = await sprinklrState.getStateByFromSnUserId(
        fromSnUserId,
        instance.bot_id
      );
    } else {
      // Usuário não encontrado, criar novo
      console.log(
        new Date(),
        `Criando novo usuário para fromSnUserId: ${fromSnUserId}`
      );
      dbUser = await this.createOrRetrieveState(null, instance, body);
    }

    if (!dbUser) {
      console.log(new Date(), `Erro ao criar/recuperar usuário`);
      return "Erro ao processar usuário";
    }

    const lastMessage = await utils.lastMessage(
      body?.payload?.firstMessageId,
      body?.payload?.latestMessageAssociatedTime
    );
    if (lastMessage == undefined) {
      return "Nenhuma mensagem para enviar";
    }

    const sessionId = dbUser.session_id;
    const setVarStr = `full_name=${userName}`;
    let payloadInbot = {
      bot_id: instance.bot_id,
      user_id: fromSnUserId,
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
      data.append("user_id", fromSnUserId);
      data.append(
        "channel",
        (body.payload.contact?.channelType || body.payload.channelType) +
          "-sprinklr"
      );
      data.append("USER_PHONE", fromSnUserId);
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

    // Identificar o channelId do bot/receptor baseado no tipo de payload
    const channelId = this.findChannelId(userData);

    // Identificar o userId baseado no tipo de payload
    let userId;
    if (userData.payload.contact && userData.payload.contact.fromSnUserId) {
      // case.create: usar fromSnUserId
      userId = userData.payload.contact.fromSnUserId;
    } else if (
      userData.payload.senderProfile &&
      userData.payload.senderProfile.channelId
    ) {
      // message.created: usar senderProfile.channelId
      userId = userData.payload.senderProfile.channelId;
    } else {
      userId = channelId;
    }

    if (!channelId || !userId) {
      console.log(new Date(), `Erro: channelId ou userId não encontrados`);
      return;
    }

    const conversationId = userData.payload.conversationId;
    const messageId =
      userData.payload.firstMessageId || userData.payload.messageId;
    const caseId = userData.payload.caseNumber;

    try {
      const user = await sprinklrState.createState(
        sessionId,
        instance.bot_id,
        channelId,
        userId,
        0,
        conversationId,
        messageId,
        caseId
      );
      console.log(new Date(), `Usuario criado: ${JSON.stringify(user)}`);
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
        const response = await sprinklrState.getStateByFromSnUserId(
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
      const response = await sprinklrState.getStateByFromSnUserId(
        dbUserState.user_name,
        instance.bot_id
      );
      return response;
    }
  }

  findChannelId(userData) {
    // Para message.created: usar receiverProfile.channelId (bot que recebe)
    if (userData?.payload?.receiverProfile) {
      return userData.payload.receiverProfile.channelId;
    }
    // Para case.create: usar contact.channelId (mesmo valor que fromSnUserId)
    else if (userData?.payload?.contact?.channelId) {
      return userData.payload.contact.channelId;
    }
    // Fallback para senderProfile (compatibilidade)
    else if (userData?.payload?.senderProfile) {
      return userData.payload.senderProfile.channelId;
    }
    return null;
  }

  getFromSnUserId(userData) {
    // Para case.create: usar contact.fromSnUserId
    if (userData?.payload?.contact?.fromSnUserId) {
      return userData.payload.contact.fromSnUserId;
    }
    // Para message.created: usar senderProfile.channelId
    else if (userData?.payload?.senderProfile?.channelId) {
      return userData.payload.senderProfile.channelId;
    }
    return null;
  }
}

module.exports = {
  InstagramService,
};
