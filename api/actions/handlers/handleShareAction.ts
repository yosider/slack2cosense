import { generateResponse } from "../../../src/cosense";
import { SlackMessageActionPayload } from "../../../types/slack";
import { sendSlackResponse } from "../lib/slackResponse";

export async function handleShareAction(
  payload: SlackMessageActionPayload
): Promise<{ success: boolean; error?: string }> {
  console.log("=== Processing Share Action ===");
  console.log("User:", payload.user.username);
  console.log("Channel:", payload.channel.name);
  console.log("Message:", payload.message.text);

  try {
    const cosenseBlocks = await generateResponse({
      team: payload.team,
      channel: payload.channel,
      message: payload.message,
      user: payload.user,
    });

    await sendSlackResponse(payload.response_url, "", cosenseBlocks);

    console.log("✅ Response sent successfully to Slack");
    return { success: true };
  } catch (error) {
    console.error("❌ Error in share action handler:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const message = `❌ *Error occurred*\n\n${errorMessage}`;
    await sendSlackResponse(payload.response_url, message, []);

    return { success: false, error: errorMessage };
  }
}
