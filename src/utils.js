const { createHash } = require("node:crypto");

function sessionGenerator(maxLen) {
  return createHash("sha3-256")
    .update(Date())
    .digest("hex")
    .substring(0, maxLen);
}

function extractTwitter(orig) {
  const stringWithoutTwitter = orig.replace(/\[twitter\]|\[\/twitter\]/g, '');
  const msg = JSON.parse(stringWithoutTwitter)
  return msg;
}

function separarBlocos(texto, index = 0, blocos = [], firstCall = true) {
  const regex = /\[(?:block|bloco)(?:\s+delay=([\d.]+))?\]/g;

  // Adiciona o texto antes do primeiro bloco na primeira chamada.
  if (firstCall) {
      const firstMatchIndex = texto.search(regex);

      // Se a busca não encontrar blocos, adiciona o texto inteiro como um bloco sem delay.
      if (firstMatchIndex === -1) {
          return [
              {
                  bloco: texto,
                  delay: null
              }
          ];
      }

      if (firstMatchIndex > 0) {
          blocos.push({
              bloco: texto.slice(0, firstMatchIndex),
              delay: null
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
      delay: delay
  });

  return separarBlocos(texto, fim, blocos, false);
};

module.exports = {
  sessionGenerator,
  extractTwitter,
  separarBlocos
};
