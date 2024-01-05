import axios from "axios";
import moment from "moment-timezone";
import qs from "qs";

const apiUrl = "https://slack.com/api";
const projectName = "yosider-private";
const maxBlockTextLen = 430;

const generateResponse = async ({ team, channel, message }) => {
    const thread_ts = message.thread_ts || message.ts;
    const threadMessages = await getThreadMessages(channel.id, thread_ts);
    const formattedMessages = threadMessages.map(msg => formatMessage(msg, team, channel)).join('\n');
    let body = `${formattedMessages}\n\n`;

    // Split the body if it exceeds the maximum length
    const bodies = [];
    while (body.length > maxBlockTextLen) {
        const slice = body.slice(0, maxBlockTextLen);
        bodies.push(slice);
        body = body.slice(maxBlockTextLen);
    }
    bodies.push(body);  // Push the remaining body

    const threadTimeText = moment.unix(thread_ts.split('.')[0]).tz('Asia/Tokyo').format("YYYY-MM-DD HH:mm:ss");
    const blocks = bodies.map(body => {
        // const encBody = encodeURIComponent(body);
        // console.log(body.length);
        // console.log(encBody.length);
    const url = `https://scrapbox.io/${projectName}/${threadTimeText}?body=${encodeURIComponent(body)}`;
        return {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<${url}|Click this link to create a page>`,
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

    // add ">" to each line
    const formattedText = msg.text
        .split("\n")
        .map(line => `> ${line}`)
        .join("\n");

    return `${metadataText}\n${formattedText}`;
}

export { generateResponse };
