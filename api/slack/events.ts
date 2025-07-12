// Import types and functions
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateResponse } from '../../src/cosense';

// Export handler for Vercel serverless function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('=== Slack Events Handler Called ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Handle different HTTP methods
    if (req.method === 'GET') {
      console.log('GET request received');
      return res.status(200).json({ 
        message: 'Slack Events API endpoint is working',
        timestamp: new Date().toISOString() 
      });
    }
    
    if (req.method === 'POST') {
      console.log('POST request received');
      
      // Handle Slack URL verification
      if (req.body && req.body.type === 'url_verification') {
        console.log('URL verification request:', req.body.challenge);
        return res.status(200).json({ challenge: req.body.challenge });
      }
      
      // Handle Slack events
      if (req.body && req.body.type === 'event_callback') {
        console.log('Event callback received:', req.body.event);
        return res.status(200).json({ status: 'received' });
      }
      
      // Handle Slack interactive components (shortcuts, message actions)
      if (req.body && req.body.payload) {
        console.log('Interactive component received');
        
        let payload;
        try {
          // Parse payload JSON
          payload = JSON.parse(req.body.payload);
          console.log('Parsed payload:', JSON.stringify(payload, null, 2));
        } catch (error) {
          console.error('Error parsing payload:', error);
          return res.status(400).json({ error: 'Invalid payload format' });
        }
        
        // Handle message actions
        if (payload.type === 'message_action') {
          console.log('Message action received:', payload.callback_id);
          
          if (payload.callback_id === 'share') {
            console.log('Share action triggered');
            console.log('User:', payload.user.username);
            console.log('Channel:', payload.channel.name);
            console.log('Message:', payload.message.text);
            
            try {
              // Convert payload to SlackShortcut format
              const shortcut = {
                team: payload.team,
                channel: payload.channel,
                message: payload.message,
                user: payload.user
              };
              
              // Generate Cosense response using the same logic as the old version
              const cosenseBlocks = await generateResponse(shortcut);
              
              // Send response back to Slack with Cosense links
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
              
              // Send response using response_url
              const response = await fetch(payload.response_url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(responseMessage)
              });
              
              if (response.ok) {
                console.log('Response sent successfully to Slack');
              } else {
                console.error('Failed to send response to Slack:', response.status, response.statusText);
              }
            } catch (error) {
              console.error('Error generating Cosense response:', error);
              
              // Send error message to Slack
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
              
              try {
                await fetch(payload.response_url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(errorMessage)
                });
              } catch (fetchError) {
                console.error('Error sending error message to Slack:', fetchError);
              }
            }
            
            // Return 200 to acknowledge receipt
            return res.status(200).json({ status: 'success' });
          }
        }
        
        // Handle shortcuts
        if (payload.type === 'shortcut') {
          console.log('Shortcut received:', payload.callback_id);
          return res.status(200).json({ status: 'shortcut received' });
        }
        
        console.log('Unknown interactive component type:', payload.type);
        return res.status(200).json({ 
          status: 'unknown interactive component type',
          type: payload.type 
        });
      }
      
      console.log('Unknown POST request type');
      return res.status(200).json({ 
        status: 'unknown request type',
        body: req.body 
      });
    }
    
    console.log('Unsupported method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error in Slack handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 