// Cosense関連型定義
export interface CosenseBlock {
  type: "section";
  text: {
    type: "mrkdwn";
    text: string;
  };
}

export interface AppConfig {
  projectName: string;
  linkMessage: string;
  maxBlockNumChar: number;
  slackApiUrl: string;
}
