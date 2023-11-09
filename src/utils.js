const { createHash } = require("node:crypto");

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
  let mediaType="";
  let mediaURLs;
  let text=orig;

  // Verifica se contém vídeo
  if (orig.match(regexVideo) !== null) {
    mediaType = "VIDEO";
    // Localiza o link do vídeo "https..."
    const regexHttps = /(?<![\(\/])(http\S+[^.,"\s])(?!\))/gi;
    mediaURLs = orig.match(regexHttps)[0] || [];
    text=orgi.replace(regexVideo,"");
  }

  // Verifica se contém imagem
  if (orig.match(regexImage) !== null) {
    mediaType = "IMAGE";
    // Localiza o link da imagem "https..."
    const regexHttps = /(?<![\(\/])(http\S+[^.,"\s])(?!\))/gi;
    mediaURLs = orig.match(regexHttps)[0] || [];
    text=orgi.replace(regexImage,"");
  }
  return mediaType!==''? [{url:mediaURLs, mediaType:mediaType, text:text}] : [];
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


module.exports = {
  sessionGenerator,
  extractTwitter,
  separarBlocos,
  extractQuickReplies,
  attachmentCreate,
  isHasOwnProperty
};
