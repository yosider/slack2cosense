import axios from "axios";
import moment from "moment-timezone";
import qs from "qs";

const apiUrl = "https://slack.com/api";
const projectName = "yosider-private";
const msg = "Click this link to create a page";
const maxBlockNumChar = 3000;

const generateResponse = async ({ team, channel, message }) => {
    const thread_ts = message.thread_ts || message.ts;
    const threadMessages = await getThreadMessages(channel.id, thread_ts);
    const formattedMessages = threadMessages.map(msg => formatMessage(msg, team, channel)).join('\n') + '\n\n';
    const body = formattedMessages.replace(/[/?#\{}^|<>%\s\n]/g, char => encodeURIComponent(char));

    const threadTimeText = moment.unix(thread_ts.split('.')[0]).tz('Asia/Tokyo').format("YYYY-MM-DD HH:mm:ss");
    const urlBase = `https://scrapbox.io/${projectName}/${threadTimeText}?body=`;
    const maxBodyLen = maxBlockNumChar - urlBase.length - msg.length - 3;

    // Split the body if it exceeds the maximum length
    const isMiddleOfEncodedChar = (str) => str.slice(-2).includes('%');
    const bodies = [];
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

    const blocks = bodies.map(slice => {
        const url = `${urlBase}${slice}`;
        // console.log(slice);
        // console.log(`<${url}|${msg}>`.length);
        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<${url}|${msg}>`,
            },
        };
    });

    return blocks;
};

const getThreadMessages = async (channelId, threadTs) => {
    const response = await axios.post(`${apiUrl}/conversations.replies`, qs.stringify({
        token: process.env.SLACK_USER_TOKEN,
        channel: channelId,
        ts: threadTs,
    }));

    const messages = response.data.messages || [];

    const userNames = await Promise.all(messages.map(msg => getUserName(msg.user)));
    messages.forEach((msg, i) => {
        msg.userName = userNames[i];
    });

    return messages;
}

const userCache = {};
const getUserName = async (userId) => {
    if (userCache[userId]) {
        return userCache[userId];
    }

    try {
        const userResponse = await axios.post(`${apiUrl}/users.info`, qs.stringify({
            token: process.env.SLACK_BOT_TOKEN,
            user: userId
        }));
        const userName = userResponse.data.user?.real_name || "Unknown User";
        userCache[userId] = userName;
        return userName;
    } catch (error) {
        console.error("Error occurred while fetching user information:", error);
        return "Unknown User";
    }
}

const formatMessage = (msg, team, channel) => {
    const timeText = moment.unix(msg.ts.split('.')[0]).tz('Asia/Tokyo').format("YYYY-MM-DD HH:mm:ss");
    const url = `https://${team.domain}.slack.com/archives/${channel.id}/p${msg.ts.replace(/\./g, "")}`;
    const metadataText = `[${msg.userName}.icon] [${timeText} ${url}]`;

    // replace link
    msg.text = msg.text.replace(/<(https:\/\/[^>|]+)(\|([^>]+))?>/g, (match, url, _, title) => {
        return title ? `[${title} ${url}]` : url;
    });

    // replace HTML entities
    msg.text = msg.text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, " ");

    // add ">" to each line
    const formattedText = msg.text
        .split("\n")
        .map(line => `> ${line}`)
        .join("\n");

    return `${metadataText}\n${formattedText}`;
}

export { generateResponse };
