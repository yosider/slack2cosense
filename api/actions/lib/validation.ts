import crypto from "crypto";

export function verifySlackSignature(
  signingSecret: string,
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(`v0:${timestamp}:${body}`);
  const expectedSignature = `v0=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export function validateRequiredEnvVars(): {
  isValid: boolean;
  missingVars: string[];
} {
  const requiredVars = [
    "SLACK_SIGNING_SECRET",
    "SLACK_BOT_TOKEN",
    "SLACK_USER_TOKEN",
  ];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

export function validatePayload(payload: any): boolean {
  if (!payload) return false;

  if (payload.type === "message_action") {
    return !!(
      payload.callback_id &&
      payload.team &&
      payload.channel &&
      payload.user &&
      payload.message &&
      payload.response_url
    );
  }

  return true;
}

export function validateSlackHeaders(headers: any): {
  isValid: boolean;
  missing: string[];
} {
  const requiredHeaders = ["x-slack-request-timestamp", "x-slack-signature"];
  const missing = requiredHeaders.filter((header) => !headers[header]);

  return {
    isValid: missing.length === 0,
    missing,
  };
}
