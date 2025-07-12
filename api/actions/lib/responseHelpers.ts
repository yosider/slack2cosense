import type { VercelResponse } from "@vercel/node";

// Success responses (2xx)
export function sendWorkingResponse(res: VercelResponse) {
  return res.status(200).json({
    message: "Slack Events API endpoint is working",
    timestamp: new Date().toISOString(),
  });
}

export function sendChallengeResponse(res: VercelResponse, challenge: string) {
  return res.status(200).json({ challenge });
}

export function sendSuccessStatus(res: VercelResponse) {
  return res.status(200).json({ status: "success" });
}

export function sendUnknownRequestStatus(res: VercelResponse) {
  return res.status(200).json({ status: "unknown_request" });
}

// Authentication errors (401)
export function sendMissingHeadersError(res: VercelResponse) {
  return res.status(401).json({ error: "Missing signature headers" });
}

export function sendInvalidSignatureError(res: VercelResponse) {
  return res.status(401).json({ error: "Invalid signature" });
}

// Client errors (4xx)
export function sendMethodNotAllowedError(res: VercelResponse) {
  return res.status(405).json({ error: "Method not allowed" });
}

// Server errors (5xx)
export function sendErrorStatus(res: VercelResponse, error: string) {
  return res.status(500).json({ error });
}

export function sendInternalServerError(res: VercelResponse, error: unknown) {
  return res.status(500).json({
    error: "Internal server error",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
