const { createHash } = require("node:crypto");
const axios = require('axios');
const qs = require('qs');
const { SprinklrCredentialsDAO } = require("./models/SprinklrCredentialsDAO");

function sessionGenerator(maxLen) {
  return createHash("sha3-256")
    .update(Date())
    .digest("hex")
    .substring(0, maxLen);
}

function extractTwitter(orig) {
  const origStr = JSON.stringify(orig);
  const stringWithoutTwitter = origStr.replace(
    /\[twitter\]|\[\/twitter\]/g,
    ""
  );
  const msg = JSON.parse(stringWithoutTwitter);
  return msg;
}

function separarBlocos(texto, index = 0, blocos = [], firstCall = true) {
  const regex = /\[(?:block|bloco)(?:\s+delay=([\d.]+))?\]/g;

  // Adiciona o texto antes do primeiro bloco na primeira chamada.
  if (firstCall && texto) {
    const firstMatchIndex = texto.search(regex);

    // Se a busca não encontrar blocos, adiciona o texto inteiro como um bloco sem delay.
    if (firstMatchIndex === -1) {
      return [
        {
          bloco: texto,
          delay: null,
        },
      ];
    }

    if (firstMatchIndex > 0) {
      blocos.push({
        bloco: texto.slice(0, firstMatchIndex),
        delay: null,
      });
    }
  }

  // Define a posição inicial para a busca regex.
  regex.lastIndex = index;

  const match = regex.exec(texto);
  if (match === null) {
    return blocos;
  }

  const inicio = match.index + match[0].length;
  const delay = match[1] ? parseFloat(match[1]) : null;
  const proximoMatch = regex.exec(texto);
  const fim = proximoMatch ? proximoMatch.index : texto.length;

  // Adiciona o bloco e o valor de delay (se disponível) à lista de blocos.
  blocos.push({
    bloco: texto.slice(inicio, fim),
    delay: delay,
  });

  return separarBlocos(texto, fim, blocos, false);
}

function attachmentCreate(orig) {
  const regexVideo = /<video\s?.*?<\/video\s*>/gi;
  const regexImage = /<img\s?.*?\/>/gi
  let mediaType = "";
  let mediaURLs;
  let text = orig;

  // Verifica se contém vídeo
  if (orig.match(regexVideo) !== null) {
    mediaType = "VIDEO";
    // Localiza o link do vídeo "https..."
    const regexHttps = /(?<![\(\/])(http\S+[^.,"\s])(?!\))/gi;
    mediaURLs = orig.match(regexHttps)[0] || [];
    text = orgi.replace(regexVideo, "");
  }

  // Verifica se contém imagem
  if (orig.match(regexImage) !== null) {
    mediaType = "IMAGE";
    // Localiza o link da imagem "https..."
    const regexHttps = /(?<![\(\/])(http\S+[^.,"\s])(?!\))/gi;
    mediaURLs = orig.match(regexHttps)[0] || [];
    text = orgi.replace(regexImage, "");
  }
  return mediaType !== '' ? [{ url: mediaURLs, mediaType: mediaType, text: text }] : [];
}


function extractQuickReplies(orig) {
  let match = orig.match(
    /^(?<main>.*)\[quick_replies\](?<quickreplies>.*?)\[\/quick_replies\](?<rest>.*)$/s
  );
  if (!match) {
    return [orig, []];
  } else {
    let text = match.groups.main + match.groups.rest;
    let qr = match.groups.quickreplies;
    try {
      let obj = JSON.parse("[" + qr + "]");
      if (Array.isArray(obj)) {
        return [
          text,
          obj.flat().map((el) => {
            return {
              title: el.title,
              value: el.payload || el.title,
            };
          }),
        ];
      } else {
        console.log(
          new Date(),
          `: quick_reply has the wrong format: (${typeof obj}): [${orig}]`
        );
        return [orig, []];
      }
    } catch (err) {
      console.log(
        new Date(),
        `: Error in quick_replies: ${err}. Msg=[${orig}]`
      );
      return [orig, []];
    }
  }
}

function isEmptyObject(obj) {
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) return false;
  }
  return true;
}


function isHasOwnProperty(o, i) {
  return !isEmptyObject(o) && Object.prototype.hasOwnProperty.call(o, i);
}

const speechToText = async function (audio) {
  try {
    const token = await speechToTextToken();

    const data = qs.stringify({
      'session': token,
      'user_id': 'edu_precisa_mudar',
      'channel': 'testChannel',
      'url': audio
    });

    const config = {
      method: 'post',
      url: 'https://tools.inbot.com.br/speech/v1/audio/transcribe/url',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios.request(config);
    const transcription = response.data[0][0];

    console.log(JSON.stringify(transcription));
    return transcription;
  } catch (error) {
    console.error(error);
    throw error; // lança o erro novamente para que o chamador possa lidar com ele
  }
}


const speechToTextToken = async function () {
  try {
    const data = qs.stringify({
      'client': 'edu_precisa_mudar',
      'secret': 'senhavazia_precisa_mudar',
      'channel': 'testChannel'
    });

    const config = {
      method: 'post',
      url: 'https://tools.inbot.com.br/speech/v1/auth/login',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios.request(config);
    return response.data.session_id; // ou qualquer propriedade que contenha o token
  } catch (error) {
    console.error(error);
    throw error; // lança o erro novamente para que o chamador possa lidar com ele
  }
}
const checkControl = async function (caseId) {
  try {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = await sprinklrCredentials.getCredentials(); //dados retorno do banco
    credentials = credentials[0];

    const url_sprinklr = 'https://api2.sprinklr.com/api/v2/thread/get-controlling-participant';
    const headers = {
      Key: credentials.client_id,
      Authorization: `Bearer ${credentials.token}`,
    };

    const body = {
      entityType: 'CASE',
      entityId: caseId,
    };

    const response = await axios.post(url_sprinklr, body, { headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(error.response.data);
      return error.response.data;
    } else if (error.request) {
      console.error('Sem resposta do servidor:', error.request);
      return { error: 'Sem resposta do servidor' };
    } else {
      console.error('Erro ao processar requisição:', error.message);
      return { error: 'Erro ao processar requisição' };
    }
  }
};

const lastMessage = async function (messageId, untilDate) {
  try {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = await sprinklrCredentials.getCredentials(); //dados retorno do banco
    credentials = credentials[0];

    const url_sprinklr = 'https://api2.sprinklr.com/api/v2/message/conversations';
    const headers = {
      Key: credentials.client_id,
      Authorization: `Bearer ${credentials.token}`,
    };

    const body = {
      messageId: messageId,
      sinceDate: untilDate,
      untilDate: untilDate,
      start: 0,
      rows: 1,
    };

    const response = await axios.post(url_sprinklr, body, { headers });
    console.log(new Date(),`Resposta lastMessage: ${JSON.stringify(response.data.data[0])}`)
    return response.data.data[0];
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      return error.response.data;
    } else if (error.request) {
      console.log('Sem resposta do servidor:', error.request);
      return { error: 'Sem resposta do servidor' };
    } else {
      console.log('Erro ao processar requisição:', error.message);
      return { error: 'Erro ao processar requisição' };
    }
  }
};
const changeParticipantControl = async function (caseId) {
  try {
    const sprinklrCredentials = new SprinklrCredentialsDAO();
    let credentials = await sprinklrCredentials.getCredentials(); //dados retorno do banco
    credentials = credentials[0];

    const url_sprinklr = 'https://api2.sprinklr.com/api/v2/thread/pass-control';
    const headers = {
      Key: credentials.client_id,
      Authorization: `Bearer ${credentials.token}`,
    };

    const body = {
      "entityType": "CASE",
      "entityId": caseId,
      "participantId": "Sprinklr"
  }

    const response = await axios.post(url_sprinklr, body, { headers });
    console.log(new Date(),`Resposta pass control: ${JSON.stringify(response.data)}`)
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      return error.response.data;
    } else if (error.request) {
      console.log('Sem resposta do servidor:', error.request);
      return { error: 'Sem resposta do servidor' };
    } else {
      console.log('Erro ao processar requisição:', error.message);
      return { error: 'Erro ao processar requisição' };
    }
  }
};



module.exports = {
  sessionGenerator,
  extractTwitter,
  separarBlocos,
  extractQuickReplies,
  attachmentCreate,
  isHasOwnProperty,
  speechToText,
  checkControl,
  lastMessage,
  changeParticipantControl,
};
