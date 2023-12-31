import pkg from '@slack/bolt';
import { generateResponse } from './scrapbox.js';
const { App } = pkg;

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.shortcut('share', async ({ shortcut, ack, client }) => {
    await ack();  // return acknowledgement
    const res = await generateResponse(shortcut);

    await client.chat.postMessage({
        channel: shortcut.user.id,
        blocks: res,
    });
});

app.error((error) => {
    console.error(error);
});

(async () => {
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}`);
})();
