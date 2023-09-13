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

module.exports = {
  sessionGenerator,
  extractTwitter
};
