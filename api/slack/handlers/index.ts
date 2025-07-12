import { SlackMessageActionPayload } from "../../../types/slack";
import { handleShareAction } from "./handleShareAction";

export async function handleMessageActions(
  payload: SlackMessageActionPayload
): Promise<{ success: boolean; error?: string }> {
  switch (payload.callback_id) {
    case "share":
      return await handleShareAction(payload);
    default:
      console.log("❓ Unknown callback_id:", payload.callback_id);
      return {
        success: false,
        error: `Unknown callback_id: ${payload.callback_id}`,
      };
  }
}
