import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { generateResponse } from '../../src/cosense';
import {
  SlackEventCallbackPayload,
  SlackMessageActionPayload,
  SlackUrlVerificationPayload
} from '../../src/types/slack';

// Utility Functions
function verifySlackSignature(signingSecret: string, body: string, timestamp: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(`v0:${timestamp}:${body}`);
  const expectedSignature = `v0=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

function getRawBody(req: VercelRequest): string {
  if (req.body && typeof req.body === 'string') {
    return req.body;
  }
  if (req.body && typeof req.body === 'object') {
    return new URLSearchParams(req.body).toString();
  }
  return '';
}

function parsePayload(body: any): SlackMessageActionPayload | null {
  if (!body || !body.payload) {
    return null;
  }
  
  try {
    return JSON.parse(body.payload) as SlackMessageActionPayload;
  } catch (error) {
    console.error('Error parsing payload:', error);
    return null;
  }
}

// Feature Handlers
async function handleShareAction(payload: SlackMessageActionPayload): Promise<{ success: boolean; error?: string }> {
  console.log('=== Processing Share Action ===');
  console.log('User:', payload.user.username);
  console.log('Channel:', payload.channel.name);
  console.log('Message:', payload.message.text);
  
  try {
    // Convert payload to format expected by generateResponse
    const shortcut = {
      team: payload.team,
      channel: payload.channel,
      message: payload.message,
      user: payload.user
    };
    
    // Generate Cosense response
    const cosenseBlocks = await generateResponse(shortcut);
    
    // Prepare response message
    const responseMessage = {
      text: `✅ CosenseのページURLを生成しました！`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *CosenseのページURL を生成しました！*\n\n*元のメッセージ:*\n> ${payload.message.text}\n\n*チャンネル:* #${payload.channel.name}\n*ユーザー:* ${payload.user.username}\n\n下記のリンクをクリックしてCosenseにページを作成してください：`
          }
        },
        ...cosenseBlocks
      ]
    };
    
    // Send response to Slack
    const response = await fetch(payload.response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseMessage)
    });
    
    if (response.ok) {
      console.log('✅ Response sent successfully to Slack');
      return { success: true };
    } else {
      console.error('❌ Failed to send response to Slack:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    console.error('❌ Error in share action handler:', error);
    
    // Try to send error message to Slack
    try {
      const errorMessage = {
        text: `❌ エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `❌ *エラーが発生しました*\n\nCosenseのURLを生成できませんでした。\nエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          }
        ]
      };
      
      await fetch(payload.response_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorMessage)
      });
    } catch (fetchError) {
      console.error('❌ Error sending error message to Slack:', fetchError);
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Main Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== Slack Events Handler ===');
  console.log('Method:', req.method);
  console.log('Path:', req.url);
  
  try {
    // Handle GET requests
    if (req.method === 'GET') {
      return res.status(200).json({ 
        message: 'Slack Events API endpoint is working',
        timestamp: new Date().toISOString() 
      });
    }
    
    // Handle POST requests
    if (req.method === 'POST') {
      console.log('📨 POST request received');
      
      // Verify Slack signature
      const timestamp = req.headers['x-slack-request-timestamp'] as string;
      const signature = req.headers['x-slack-signature'] as string;
      const rawBody = getRawBody(req);
      
      if (!timestamp || !signature) {
        console.error('❌ Missing signature headers');
        return res.status(401).json({ error: 'Missing signature headers' });
      }
      
      if (!verifySlackSignature(process.env.SLACK_SIGNING_SECRET!, rawBody, timestamp, signature)) {
        console.error('❌ Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      console.log('✅ Signature verified');
      
      // Handle URL verification
      const body = req.body as SlackUrlVerificationPayload;
      if (body.type === 'url_verification') {
        console.log('🔗 URL verification request');
        return res.status(200).json({ challenge: body.challenge });
      }
      
      // Handle Interactive Components (message actions)
      const payload = parsePayload(req.body);
      if (payload && payload.type === 'message_action') {
        console.log('🎯 Message action received:', payload.callback_id);
        
        if (payload.callback_id === 'share') {
          const result = await handleShareAction(payload);
          
          if (result.success) {
            return res.status(200).json({ status: 'success' });
          } else {
            return res.status(500).json({ error: result.error });
          }
        } else {
          console.log('❓ Unknown callback_id:', payload.callback_id);
          return res.status(200).json({ status: 'unknown_callback' });
        }
      }
      
      // Handle Event Callbacks
      const eventBody = req.body as SlackEventCallbackPayload;
      if (eventBody.type === 'event_callback') {
        console.log('📅 Event callback received');
        // Add event handling logic here if needed
        return res.status(200).json({ status: 'event_received' });
      }
      
      // Unknown request type
      console.log('❓ Unknown request type:', req.body);
      return res.status(200).json({ status: 'unknown_request' });
    }
    
    // Unsupported method
    console.log('❌ Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 