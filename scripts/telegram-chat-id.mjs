// Finds the chat id to put in TELEGRAM_CHAT_ID.
// 1. Put TELEGRAM_BOT_TOKEN in .env.local
// 2. Open your bot in Telegram and send it any message (or add it to a group and write in the group)
// 3. Run: npm run telegram:chat-id
// Optional: npm run telegram:chat-id -- --test   (also sends a test message to every chat found)

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing. Add it to .env.local first (get it from @BotFather).");
  process.exit(1);
}
const api = `https://api.telegram.org/bot${token}`;

const me = await (await fetch(`${api}/getMe`)).json();
if (!me.ok) {
  console.error(`The token was refused by Telegram: ${me.description}`);
  process.exit(1);
}
console.log(`Bot: @${me.result.username}\n`);

const updates = await (await fetch(`${api}/getUpdates`)).json();
const chats = new Map();
for (const u of updates.result ?? []) {
  const chat = (u.message ?? u.channel_post ?? u.my_chat_member)?.chat;
  if (chat) chats.set(chat.id, chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ") ?? chat.username);
}

if (chats.size === 0) {
  console.log(`No messages found. Open https://t.me/${me.result.username}, press Start (or send "hello"), then run this again.`);
  process.exit(0);
}

console.log("Chats that wrote to the bot:");
for (const [id, name] of chats) console.log(`  ${name}  →  TELEGRAM_CHAT_ID=${id}`);

if (process.argv.includes("--test")) {
  for (const id of chats.keys()) {
    const r = await (await fetch(`${api}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: id, text: "✅ AFNAR: test message. New orders will arrive here." }),
    })).json();
    console.log(`  test message to ${id}: ${r.ok ? "sent" : r.description}`);
  }
}
