import { SlackResponseBlock, SlackResponseMessage } from '../../../src/types/slack';

export async function sendSuccessResponse(
  responseUrl: string,
  message: string,
  blocks: SlackResponseBlock[]
): Promise<boolean> {
  const responseMessage: SlackResponseMessage = {
    text: message,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message
        }
      },
      ...blocks
    ]
  };

  try {
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseMessage)
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error sending success response:', error);
    return false;
  }
}

export async function sendErrorResponse(
  responseUrl: string,
  errorMessage: string
): Promise<boolean> {
  const errorResponse: SlackResponseMessage = {
    text: `❌ Error occurred: ${errorMessage}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `❌ *Error occurred*\n\nFailed to generate Cosense URL.\nError: ${errorMessage}`
        }
      }
    ]
  };

  try {
    const response = await fetch(responseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse)
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Error sending error response:', error);
    return false;
  }
} 