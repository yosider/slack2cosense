import { SlackResponseBlock, SlackResponseMessage } from "../../../types/slack";

export async function sendSlackResponse(
  responseUrl: string,
  message: string,
  blocks: SlackResponseBlock[]
): Promise<void> {
  const responseMessage: SlackResponseMessage = {
    text: message,
    blocks:
      message === ""
        ? blocks // no message section if message is empty, otherwise error occurs
        : [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: message,
              },
            },
            ...blocks,
          ],
  };

  const response = await fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(responseMessage),
  });

  if (!response.ok) {
    throw new Error(`Failed to send response to Slack: ${response.statusText}`);
  }
}
