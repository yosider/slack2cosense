import type { VercelRequest } from "@vercel/node";
import { SlackMessageActionPayload } from "../../../src/types/slack";

export function getRawBody(req: VercelRequest): string {
  if (req.body && typeof req.body === "string") {
    return req.body;
  }
  if (req.body && typeof req.body === "object") {
    return new URLSearchParams(req.body).toString();
  }
  return "";
}

export function parsePayload(body: any): SlackMessageActionPayload | null {
  if (!body || !body.payload) {
    return null;
  }

  try {
    return JSON.parse(body.payload) as SlackMessageActionPayload;
  } catch (error) {
    console.error("Error parsing payload:", error);
    return null;
  }
}
