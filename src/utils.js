const { createHash } = require("node:crypto");

function sessionGenerator(maxLen) {
  return createHash("sha3-256")
    .update(Date())
    .digest("hex")
    .substring(0, maxLen);
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
              payload: el.payload || el.title,
              action: el.content_type
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

module.exports = {
  sessionGenerator,
  extractQuickReplies,
};
