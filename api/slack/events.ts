import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  SlackEventCallbackPayload,
  SlackMessageActionPayload,
  SlackUrlVerificationPayload
} from '../../src/types/slack';
import { processMessageAction } from './handlers/messageAction';
import { verifySlackSignature } from './utils/validation';


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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== Slack Events Handler ===');
  console.log('Method:', req.method);
  console.log('Path:', req.url);
  
  try {
    if (req.method === 'GET') {
      return res.status(200).json({ 
        message: 'Slack Events API endpoint is working',
        timestamp: new Date().toISOString() 
      });
    }
    
    if (req.method === 'POST') {
      console.log('📨 POST request received');
      
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
      
      const body = req.body as SlackUrlVerificationPayload;
      if (body.type === 'url_verification') {
        console.log('🔗 URL verification request');
        return res.status(200).json({ challenge: body.challenge });
      }
      
      const payload = parsePayload(req.body);
      if (payload && payload.type === 'message_action') {
        console.log('🎯 Message action received:', payload.callback_id);
        
        const result = await processMessageAction(payload);
        
        if (result.success) {
          return res.status(200).json({ status: 'success' });
        } else {
          return res.status(500).json({ error: result.error });
        }
      }
      
      const eventBody = req.body as SlackEventCallbackPayload;
      if (eventBody.type === 'event_callback') {
        console.log('📅 Event callback received');
        return res.status(200).json({ status: 'event_received' });
      }
      
      console.log('❓ Unknown request type:', req.body);
      return res.status(200).json({ status: 'unknown_request' });
    }
    
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