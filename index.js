const { App } = require("@slack/bolt");
const store = require("./store");
const { WebClient, LogLevel } = require("@slack/web-api");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

const client = new WebClient(process.env.SLACK_BOT_TOKEN, {
  // LogLevel can be imported and used to make debugging simpler
  logLevel: LogLevel.DEBUG
});

app.event("app_home_opened", ({ event, say }) => {
  // Look up the user from DB
  let user = store.getUser(event.user);

  if (!user) {
    user = {
      user: event.user,
      channel: event.channel
    };
    store.addUser(user);

    say(`Hello world, and welcome <@${event.user}>!`);
  } else {
    say("Hi again!");
  }
});

app.command("/test", async ({ command, ack }) => {
  try {
    await ack();
    let members = [];
    // Call the users.list method using the WebClient
    const f = async () => {
      const result = (await client.users.list()).members;
      result.map(r => {
        const { real_name, is_bot } = r;
        // console.log("real_name", real_name);
        // console.log("is_bot", is_bot);

        if (is_bot === true) return;
        if (real_name === "Slackbot") return;

        members.push(real_name);
      });
    };
    f();
  } catch (error) {
    console.error("error", error);
  }
  // コマンドリクエストを確認
});

const createPairs = members => {
  const pairlist = [];
  const numberList = [...Array(members.length).keys()];
  // １から順番に回していく
  numberList.map(currentNumber => {
    const doneUsers = [];
    if (pairlist.length) {
      pairlist.map(p => p.map(n => doneUsers.push(n)));
    }
    // もし、今の番号が、pairの番号に含まれていたら、スキップ
    if (doneUsers.includes(members[currentNumber])) return;

    let isIncluded = true;
    // 0~ 69までの中でランダムな数字を生成
    let pairNumber = Math.floor(Math.random() * members.length);

    while (isIncluded) {
      // もし生成されたランダムな数字がpairに含まれていたら、再度ランダムな数字を生成する
      if (doneUsers.includes(members[pairNumber]) || members[currentNumber] === members[pairNumber]) {
        pairNumber = Math.floor(Math.random() * members.length);
      } else {
        // 含まれていない場合
        isIncluded = false;
        pairlist.push([members[currentNumber], members[pairNumber]]);
      }
    }
  });
  console.log("pairlist", pairlist);
  return pairlist;
};

app.command("/coffeetime", async ({ command, ack }) => {
  try {
    await ack();
    let members = [];
    // Call the users.list method using the WebClient
    const f = async () => {
      const result = (await client.users.list()).members;
      result.map(r => {
        const { name, is_bot } = r;

        if (is_bot === true) return;
        if (name === "Slackbot") return;

        members.push(name);
      });
      createPairs(members);
    };
    f();
  } catch (error) {
    console.error("error", error);
  }
  // コマンドリクエストを確認
});

// Start your app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bolt app is running!");
})();
