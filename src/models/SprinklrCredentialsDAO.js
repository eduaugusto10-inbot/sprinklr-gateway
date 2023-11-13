const db = require("../config/db");

class SprinklrCredentialsDAO {
  getCredentials() {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM sprinklr_credentials WHERE client_id = ? ORDER BY id DESC LIMIT 1;",
        ["265cez298wgp99eahsrk46cq"],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
  postRefreshNewToken() {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM sprinklr_credentials WHERE client_id = ? ORDER BY id DESC LIMIT 1;",
        ["265cez298wgp99eahsrk46cq"],
        (err, result) => {
          if (err) {
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
  SprinklrCredentialsDAO,
};
