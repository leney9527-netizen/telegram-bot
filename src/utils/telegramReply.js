const TELEGRAM_SAFE_LIMIT = 3500;

function splitTelegramText(text) {
  if (!text) {
    return [];
  }
  if (text.length <= TELEGRAM_SAFE_LIMIT) {
    return [text];
  }

  const lines = text.split("\n");
  const chunks = [];
  let current = "";

  const pushCurrent = () => {
    if (current) {
      chunks.push(current);
      current = "";
    }
  };

  for (const line of lines) {
    if (line.length > TELEGRAM_SAFE_LIMIT) {
      pushCurrent();
      for (let i = 0; i < line.length; i += TELEGRAM_SAFE_LIMIT) {
        chunks.push(line.slice(i, i + TELEGRAM_SAFE_LIMIT));
      }
      continue;
    }
    const next = current ? `${current}\n${line}` : line;
    if (next.length > TELEGRAM_SAFE_LIMIT) {
      pushCurrent();
      current = line;
    } else {
      current = next;
    }
  }
  pushCurrent();
  return chunks;
}

async function replyLongText(ctx, text) {
  const chunks = splitTelegramText(text);
  for (const chunk of chunks) {
    await ctx.reply(chunk);
  }
}

module.exports = { splitTelegramText, replyLongText };
