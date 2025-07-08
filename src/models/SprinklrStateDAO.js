const db = require("../config/db");

class SprinklrStateDAO {
  createState(
    sessionId,
    botId,
    channelId,
    userId,
    sendToInchat,
    conversationId,
    messageId,
    caseId
  ) {
    const now = new Date();

    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO sprinklr_state (session_id,bot_id,channel_id,user_name,send_to_inchat,conversation_id,message_id,first_interaction,last_interaction, case_id) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          sessionId,
          botId,
          channelId,
          userId,
          sendToInchat,
          conversationId,
          messageId,
          now,
          now,
          caseId,
        ],
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
            console.log(
              new Date(),
              `getStateById: ${JSON.stringify(
                result
              )}, ${userId} e ${instanceId}`
            );
            resolve(result[0]);
          }
        }
      );
    });
  }

  updateUserState(userId, botId) {
    const now = new Date();
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
  updateEscalationUser(escalation, userId, botId) {
    const now = new Date();
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE sprinklr_state SET send_to_inchat = ?, last_interaction = ? WHERE user_name=? AND bot_id=?",
        [escalation, now, userId, botId],
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
        "UPDATE sprinklr_state SET last_interaction = ?, session_id = ? WHERE user_name=? AND bot_id=?",
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

  // Buscar usuário pelo fromSnUserId
  getStateByFromSnUserId(fromSnUserId, instanceId) {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM sprinklr_state WHERE user_name=? AND bot_id=?",
        [fromSnUserId, instanceId],
        (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            console.log(
              new Date(),
              `getStateByFromSnUserId: ${JSON.stringify(
                result
              )}, ${fromSnUserId} e ${instanceId}`
            );
            resolve(result[0]);
          }
        }
      );
    });
  }

  // Atualizar caseId do usuário
  updateUserCaseId(userId, botId, caseId) {
    const now = new Date();
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE sprinklr_state SET case_id = ?, last_interaction = ? WHERE user_name=? AND bot_id=?",
        [caseId, now, userId, botId],
        (err, result) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
}

module.exports = {
  SprinklrStateDAO,
};
