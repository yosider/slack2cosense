// Slack-related type definitions
export interface SlackTeam {
  domain: string;
}

export interface SlackChannel {
  id: string;
}

export interface SlackUser {
  id: string;
}

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  thread_ts?: string;
  userName?: string;
}

export interface SlackShortcut {
  team: SlackTeam;
  channel: SlackChannel;
  message: SlackMessage;
  user: SlackUser;
}

// Slack API response type definitions
export interface SlackConversationRepliesResponse {
  ok: boolean;
  messages?: SlackMessage[];
  error?: string;
}

export interface SlackUserInfoResponse {
  ok: boolean;
  user?: {
    real_name?: string;
    name?: string;
  };
  error?: string;
}

// Cosense-related type definitions
export interface CosenseBlock {
  type: "section";
  text: {
    type: "mrkdwn";
    text: string;
  };
}

// Configuration type definitions
export interface AppConfig {
  projectName: string;
  linkMessage: string;
  maxBlockNumChar: number;
  slackApiUrl: string;
} 