const db = require("../config/db");

class SprinklrStateDAO {
  createState(sessionId,botId,channelId,userId,sendToInchat,conversationId,messageId) {
    const now = new Date();

    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO sprinklr_state (session_id,bot_id,channel_id,user_name,send_to_inchat,conversation_id,message_id,first_interaction,last_interaction) VALUES(?,?,?,?,?,?,?,?,?)",
        [sessionId,botId,channelId,userId,sendToInchat,conversationId,messageId,now,now],
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log(result);
            resolve(result);
          }
        }
      );
    });
  }

  getStateByUserId(userId, instanceId) {

    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM sprinklr_state WHERE user_name=? AND bot_id=?",
        [userId, instanceId],
        (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log(new Date(), `getStateById: ${JSON.stringify(result)}, ${userId} e ${instanceId}`)
            resolve(result[0]);
          }
        }
      );
    });
  }

  updateUserState(userId, botId) {
    const now = new Date();
    console.log("aqui")
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE sprinklr_state SET last_interaction = ? WHERE user_name=? AND bot_id=?",
        [now, userId, botId],
        (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  updateUserSessionState(userId, botId, sessionId) {
    const now = new Date();
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE sprinklr_state SET last_interaction = ? AND session_id WHERE user_name=? AND bot_id=?",
        [now, sessionId, userId, botId],
        (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

module.exports = {
  SprinklrStateDAO,
};
