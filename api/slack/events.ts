import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SlackUrlVerificationPayload } from "../../src/types/slack";
import { processMessageAction } from "./handlers/messageAction";
import { getRawBody, parsePayload } from "./utils/requestParser";
import {
  sendChallengeResponse,
  sendErrorStatus,
  sendInternalServerError,
  sendInvalidSignatureError,
  sendMethodNotAllowedError,
  sendMissingHeadersError,
  sendSuccessStatus,
  sendUnknownRequestStatus,
  sendWorkingResponse,
} from "./utils/responseHelpers";
import { verifySlackSignature } from "./utils/validation";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("=== Slack Events Handler ===");
  console.log("Method:", req.method);
  console.log("Path:", req.url);

  try {
    if (req.method === "GET") {
      return sendWorkingResponse(res);
    }

    if (req.method === "POST") {
      console.log("📨 POST request received");

      const timestamp = req.headers["x-slack-request-timestamp"] as string;
      const signature = req.headers["x-slack-signature"] as string;
      const rawBody = getRawBody(req);

      if (!timestamp || !signature) {
        console.error("❌ Missing signature headers");
        return sendMissingHeadersError(res);
      }

      if (
        !verifySlackSignature(
          process.env.SLACK_SIGNING_SECRET!,
          rawBody,
          timestamp,
          signature
        )
      ) {
        console.error("❌ Invalid signature");
        return sendInvalidSignatureError(res);
      }

      console.log("✅ Signature verified");

      // URL verification: Slack validates our endpoint URL during app setup
      const body = req.body as SlackUrlVerificationPayload;
      if (body.type === "url_verification") {
        console.log("🔗 URL verification request");
        return sendChallengeResponse(res, body.challenge);
      }

      // Message actions: User interactions with message shortcuts/buttons
      const payload = parsePayload(req.body);
      if (payload && payload.type === "message_action") {
        console.log("🎯 Message action received:", payload.callback_id);

        const result = await processMessageAction(payload);

        if (result.success) {
          return sendSuccessStatus(res);
        } else {
          return sendErrorStatus(res, result.error!);
        }
      }

      console.log("❓ Unknown request type:", req.body);
      return sendUnknownRequestStatus(res);
    }

    console.log("❌ Unsupported method:", req.method);
    return sendMethodNotAllowedError(res);
  } catch (error) {
    console.error("❌ Handler error:", error);
    return sendInternalServerError(res, error);
  }
}
