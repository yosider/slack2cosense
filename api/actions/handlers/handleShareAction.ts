import { generateResponse, getUserName } from "../../../src/cosense";
import { SlackMessageActionPayload } from "../../../types/slack";
import { sendErrorResponse, sendSuccessResponse } from "../lib/slackResponse";

function createSuccessMessage(
  channelName: string,
  username: string,
  messageText: string
): string {
  const quotedMessageText = messageText.replace(/^/gm, "> ");

  return (
    `✅ *Generated Cosense page URL!*\n\n` +
    `*Message:*\n` +
    `${quotedMessageText}\n\n` +
    `*Channel:* #${channelName}\n` +
    `*User:* ${username}`
  );
}

export async function handleShareAction(
  payload: SlackMessageActionPayload
): Promise<{ success: boolean; error?: string }> {
  console.log("=== Processing Share Action ===");
  console.log("User:", payload.user.username);
  console.log("Channel:", payload.channel.name);
  console.log("Message:", payload.message.text);

  try {
    const messageSenderUsername = await getUserName(payload.message.user);

    const cosenseBlocks = await generateResponse({
      team: payload.team,
      channel: payload.channel,
      message: payload.message,
      user: payload.user,
    });

    const successMessage = createSuccessMessage(
      payload.channel.name,
      messageSenderUsername,
      payload.message.text
    );

    const success = await sendSuccessResponse(
      payload.response_url,
      successMessage,
      cosenseBlocks
    );

    if (success) {
      console.log("✅ Response sent successfully to Slack");
      return { success: true };
    } else {
      throw new Error("Failed to send response to Slack");
    }
  } catch (error) {
    console.error("❌ Error in share action handler:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await sendErrorResponse(payload.response_url, errorMessage);

    return { success: false, error: errorMessage };
  }
}
