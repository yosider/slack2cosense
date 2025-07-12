import pkg from '@slack/bolt';
import { generateResponse } from './cosense.ts';
import type { SlackShortcut } from './types.ts';

const { App } = pkg;

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.shortcut('share', async ({ shortcut, ack, client }) => {
    await ack();  // return acknowledgement
    
    try {
        const res = await generateResponse(shortcut as SlackShortcut);

        await client.chat.postMessage({
            channel: shortcut.user.id,
            blocks: res,
        });
    } catch (error) {
        console.error('Error handling share shortcut:', error);
        
        // Send error message to user
        await client.chat.postMessage({
            channel: shortcut.user.id,
            text: 'Sorry, there was an error processing your request. Please try again.',
        });
    }
});

app.error(async (error) => {
    console.error('Slack app error:', error);
});

(async () => {
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}`);
})(); 