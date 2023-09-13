const { default: axios } = require("axios");
const { SprinklrInstanceDAO } = require("../models/SprinklrInstanceDAO");
const { SprinklrStateDAO } = require("../models/SprinklrStateDAO");
const utils = require("../utils");
const { TwitterBotService } = require("./TwitterBotService");
// Se não houver receiverProfile a comunicação realizada não foi via messages, tenho que ignorar
class TwitterService {
  async getMessage(body) {
    const sprinklrInstance = new SprinklrInstanceDAO();
    const sprinklrState = new SprinklrStateDAO();
    const twitterBotService = new TwitterBotService();

    const channelID = body.payload.receiverProfile.channelId;
    let instance = await sprinklrInstance.getInstanceByChannelID(channelID); //dados retorno do banco
    instance = instance[0];
    console.log(new Date(), `Instance data ${JSON.stringify(instance)}`);
    if (instance === undefined) {
      console.log(new Date(), `Bot ${channelID} não cadastrado`);
      return "Bot não cadastrado";
    }
    const setVarStr = "";
    // Verifica se usuario existe, caso nao cadastra
    const dbUserState = await sprinklrState.getStateByUserId(body.payload.senderProfile.channelId,instance.bot_id);
    console.log(new Date(), `Usuario: ${JSON.stringify(dbUserState)}`)
    const dbUser = await this.createOrRetrieveState(dbUserState,instance,body)
    console.log(dbUser)
    const sessionId = dbUser.session_id
    let payloadInbot = {
      bot_id: instance.bot_id,
      user_id: body.payload.senderProfile.channelId,
      bot_server_type: instance.bot_server_type,
      bot_token: instance.bot_token,
      channel: body.payload.channelType,
      user_phrase: body.payload.content.text,
      setvar: setVarStr,
      session_id: sessionId,
      url_webhook: instance.url_webhook,
    };
    console.log(payloadInbot);
    try {
      await axios.post(instance.url_bot,payloadInbot).then(resp=>{
        console.log(resp.data)
        twitterBotService.postMessage(body,resp.data)
      })
      // console.log(body);
    } catch (error) {}
  }

  async createOrRetrieveState(dbUserState,instance,userData) {
    if (!dbUserState || dbUserState.length === 0) {
      return await this.createNewState(instance,userData);
    } else {                        
      const resp = await this.recreateSessionIfNecessary(instance,dbUserState);
      console.log(new Date(), `dbUserState: ${JSON.stringify(resp)}`)
      return resp 
    }
  }

  async createNewState(instance,userData) { 
    const sprinklrState = new SprinklrStateDAO();
    const sessionId = utils.sessionGenerator(32);
    const channelId = userData.payload.senderProfile.channelId;
    const conversationId = userData.payload.conversationId;
    const messageId = userData.payload.messageId;
    try {
      const user = await sprinklrState.createState(sessionId,instance.bot_id,channelId,channelId,0,conversationId,messageId)
      console.log(new Date(), `Usuario criado: ${JSON.stringify(user)}`)
      return user;
    } catch (error) {
      console.log(error)
    }
  }

  async recreateSessionIfNecessary(instance,dbUserState){
    
    const sprinklrState = new SprinklrStateDAO()
    const now = new Date();
    let lastInteraction = new Date(dbUserState.last_interaction);
    lastInteraction = lastInteraction.setMinutes(lastInteraction.getMinutes() + 30);
    lastInteraction = new Date(lastInteraction)
    if(now > lastInteraction){
      const sessionId = utils.sessionGenerator(32);
      try {
        await sprinklrState.updateUserSessionState(dbUserState.user_name,instance.bot_id,sessionId);
        const response = await sprinklrState.getStateByUserId(dbUserState.user_name,instance.bot_id)
        return response;
      } catch (error) {
        
      }
    } else{
      await sprinklrState.updateUserState(dbUserState.user_name,instance.bot_id)
      const response = await sprinklrState.getStateByUserId(dbUserState.user_name,instance.bot_id)
      return response;
    }
  }
}

module.exports = {
  TwitterService,
};
