const axios = require("axios");
const qs = require("qs");
const { SprinklrCredentialsDAO } = require("../models/SprinklrCredentialsDAO");

class CredentialsService {
  async refreshToken() {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = sprinklrCredentials.getCredentials();
    credentials = credentials[0];

    let params = {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: "refresh_token",
      redirect_uri: "https://webhook.site/3678feeb-b766-4e60-aeba-5cf05d9a2b53",
    };

    let data = qs.stringify({
      refresh_token: credentials.refresh_token,
    });

    let config = {
      method: "post",
      url: "https://api3.sprinklr.com/oauth/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
      params: params,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = {
  CredentialsService,
};
