export interface SlackTeam {
  id: string;
  domain: string;
}

export interface SlackChannel {
  id: string;
  name: string;
}

export interface SlackUser {
  id: string;
  username: string;
  name: string;
  team_id?: string;
}

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  type?: string;
  team?: string;
  blocks?: any[];
  thread_ts?: string;
  userName?: string;
}

export interface SlackShortcut {
  team: SlackTeam;
  channel: SlackChannel;
  message: SlackMessage;
  user: SlackUser;
}

// Slack event payloads
export interface SlackUrlVerificationPayload {
  type: "url_verification";
  challenge: string;
}

export interface SlackEventCallbackPayload {
  type: "event_callback";
  team_id: string;
  api_app_id: string;
  event: any;
}

export interface SlackMessageActionPayload {
  type: "message_action";
  callback_id: string;
  team: SlackTeam;
  channel: SlackChannel;
  user: SlackUser;
  message: SlackMessage;
  response_url: string;
  trigger_id: string;
  action_ts: string;
  message_ts: string;
  token?: string;
}

export interface SlackShortcutPayload {
  type: "shortcut";
  callback_id: string;
  team: SlackTeam;
  user: SlackUser;
  response_url: string;
  trigger_id: string;
  token: string;
}

export interface SlackInteractiveComponentPayload {
  payload: string;
}

// Slack API responses
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

export interface SlackResponseBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

export interface SlackResponseMessage {
  text: string;
  blocks: SlackResponseBlock[];
}
