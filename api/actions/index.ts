import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleMessageActions } from "./handlers";
import { getRawBody, parsePayload } from "./lib/requestParser";
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
} from "./lib/responseHelpers";
import { verifySlackSignature } from "./lib/validation";

// Vercel config: will be automatically loaded
export const config = {
  api: {
    bodyParser: false, // Disable Vercel's body parser to get raw body data for signature verification
  },
};

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

      // Signature verification
      const timestamp = req.headers["x-slack-request-timestamp"] as string;
      const signature = req.headers["x-slack-signature"] as string;
      if (!timestamp || !signature) {
        console.error("❌ Missing signature headers");
        return sendMissingHeadersError(res);
      }

      const rawBody = await getRawBody(req);

      const isValid = verifySlackSignature(
        process.env.SLACK_SIGNING_SECRET!,
        rawBody,
        timestamp,
        signature
      );
      if (!isValid) {
        console.error("❌ Invalid signature");
        return sendInvalidSignatureError(res);
      }
      console.log("✅ Signature verified");

      // Parse body data
      const parsedBody = new URLSearchParams(rawBody);
      const bodyObject = Object.fromEntries(parsedBody);

      // URL verification: Slack validates our endpoint URL during app setup
      if (bodyObject.type === "url_verification") {
        console.log("🔗 URL verification request");
        return sendChallengeResponse(res, bodyObject.challenge);
      }

      // Message actions: User interactions with message shortcuts/buttons
      const payload = parsePayload(bodyObject);
      if (payload && payload.type === "message_action") {
        console.log("🎯 Message action received:", payload.callback_id);

        const result = await handleMessageActions(payload);

        if (result.success) {
          return sendSuccessStatus(res);
        } else {
          return sendErrorStatus(res, result.error!);
        }
      }

      console.log("❓ Unknown request type:", bodyObject);
      return sendUnknownRequestStatus(res);
    }

    console.log("❌ Unsupported method:", req.method);
    return sendMethodNotAllowedError(res);
  } catch (error) {
    console.error("❌ Handler error:", error);
    return sendInternalServerError(res, error);
  }
}
