import { generateResponse, type SlackShortcut } from '@/index';
import { App, ExpressReceiver } from '@slack/bolt';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Slack Bolt app with custom receiver
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  processBeforeResponse: true,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

// Handle shortcut events
app.shortcut('share', async ({ shortcut, ack, client }) => {
  try {
    await ack();
    
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

// Handle app errors
app.error(async (error) => {
  console.error('Slack app error:', error);
});

// Export handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Handle the request using the Slack Bolt receiver
    await receiver.app(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 