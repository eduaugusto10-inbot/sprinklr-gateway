const axios = require("axios");

const postFile = async function (bodyData) {
  let urlBot = "https://in.bot/mod_perl/api.pl";
  let response;

  await this.postFileUpload(bodyData, urlBot).then((resp) => {
      response = resp.data[0];
    })
    .catch(function (error) {
      console.log(error);
    });
  return response;
};

const postFileUpload = function (body, url) {
  return axios(
    {
      method: "POST",
      url: url,
      data: body,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${body._boundary}`,
      },
    },
    (error) => {
      console.log(error);
    }
  );
};

module.exports = {
  postFile,
  postFileUpload,
};
