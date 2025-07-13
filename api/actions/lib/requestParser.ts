import type { VercelRequest } from "@vercel/node";
import { SlackMessageActionPayload } from "../../../types/slack";

export function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString("utf8");
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", (error) => {
      console.error("❌ Error reading raw body:", error);
      reject(error);
    });

    const timeout_ms = 5000;
    setTimeout(() => {
      console.error(`⏰ Raw body read timeout after ${timeout_ms} ms`);
      reject(new Error(`Request body read timeout after ${timeout_ms} ms`));
    }, timeout_ms);
  });
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
