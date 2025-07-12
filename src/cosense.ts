import axios, { AxiosResponse } from "axios";
import moment from "moment-timezone";
import qs from "qs";
import type {
    AppConfig,
    CosenseBlock,
    SlackChannel,
    SlackConversationRepliesResponse,
    SlackMessage,
    SlackShortcut,
    SlackTeam,
    SlackUserInfoResponse
} from "./types.js";

const config: AppConfig = {
  slackApiUrl: "https://slack.com/api",
  projectName: "yosider-private",
  linkMessage: "Click this link to create a page",
  maxBlockNumChar: 3000,
};

const generateResponse = async (shortcut: SlackShortcut): Promise<CosenseBlock[]> => {
  const { team, channel, message } = shortcut;
  const thread_ts = message.thread_ts || message.ts;
  
  try {
    const threadMessages = await getThreadMessages(channel.id, thread_ts);
    const formattedMessages = threadMessages.map(msg => formatMessage(msg, team, channel)).join('\n') + '\n\n';
    let body = formattedMessages.replace(/[/?#\{}^|<>%\s\n]/g, char => encodeURIComponent(char));

    const threadTimeText = moment.unix(parseFloat(thread_ts.split('.')[0])).tz('Asia/Tokyo').format("YYYY-MM-DD HH:mm:ss");
    const urlBase = `https://cosense.io/${config.projectName}/${threadTimeText}?body=`;
    const maxBodyLen = config.maxBlockNumChar - urlBase.length - config.linkMessage.length - 3;

    // Split the body if it exceeds the maximum length
    const isMiddleOfEncodedChar = (str: string): boolean => str.slice(-2).includes('%');
    const bodies: string[] = [];
    
    while (body.length > maxBodyLen) {
      let idx = maxBodyLen;

      // Find the last '%' character to avoid breaking the encoded string
      while (isMiddleOfEncodedChar(body.slice(0, idx))) {
        idx--;
      }

      const slice = body.slice(0, idx);
      bodies.push(slice);
      body = body.slice(idx);
    }
    bodies.push(body);  // Push the remaining body

    const blocks: CosenseBlock[] = bodies.map(slice => {
      const url = `${urlBase}${slice}`;
      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${url}|${config.linkMessage}>`,
        },
      };
    });

    return blocks;
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate Cosense response");
  }
};

const getThreadMessages = async (channelId: string, threadTs: string): Promise<SlackMessage[]> => {
  try {
    const response: AxiosResponse<SlackConversationRepliesResponse> = await axios.post(
      `${config.slackApiUrl}/conversations.replies`,
      qs.stringify({
        token: process.env.SLACK_USER_TOKEN,
        channel: channelId,
        ts: threadTs,
      })
    );

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    const messages = response.data.messages || [];

    // Get user names in parallel
    const userNames = await Promise.all(messages.map((msg: SlackMessage) => getUserName(msg.user)));
    messages.forEach((msg: SlackMessage, i: number) => {
      msg.userName = userNames[i];
    });

    return messages;
  } catch (error) {
    console.error("Error fetching thread messages:", error);
    throw new Error("Failed to fetch thread messages");
  }
};

const userCache: Record<string, string> = {};

const getUserName = async (userId: string): Promise<string> => {
  if (userCache[userId]) {
    return userCache[userId];
  }

  try {
    const userResponse: AxiosResponse<SlackUserInfoResponse> = await axios.post(
      `${config.slackApiUrl}/users.info`,
      qs.stringify({
        token: process.env.SLACK_BOT_TOKEN,
        user: userId
      })
    );

    if (!userResponse.data.ok) {
      console.warn(`Failed to get user info for ${userId}: ${userResponse.data.error}`);
      return "Unknown User";
    }

    const userName = userResponse.data.user?.real_name || userResponse.data.user?.name || "Unknown User";
    userCache[userId] = userName;
    return userName;
  } catch (error) {
    console.error("Error occurred while fetching user information:", error);
    return "Unknown User";
  }
};

const formatMessage = (msg: SlackMessage, team: SlackTeam, channel: SlackChannel): string => {
  const timeText = moment.unix(parseFloat(msg.ts.split('.')[0])).tz('Asia/Tokyo').format("YYYY-MM-DD HH:mm:ss");
  const url = `https://${team.domain}.slack.com/archives/${channel.id}/p${msg.ts.replace(/\./g, "")}`;
  const metadataText = `[${msg.userName || 'Unknown'}.icon] [${timeText} ${url}]`;

  // Replace link format
  let processedText = msg.text.replace(/<(https:\/\/[^>|]+)(\|([^>]+))?>/g, (match, url, _, title) => {
    return title ? `[${title} ${url}]` : url;
  });

  // Replace HTML entities
  processedText = processedText
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Add ">" to each line
  const formattedText = processedText
    .split("\n")
    .map(line => `> ${line}`)
    .join("\n");

  return `${metadataText}\n${formattedText}`;
};

export { generateResponse };

