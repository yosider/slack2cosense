# Slack to Cosense

A Slack app that converts Slack threads to Cosense pages using shortcuts.

## Features

- Convert Slack threads to Cosense pages with a single shortcut
- Automatically format messages with user information and timestamps
- Handle long content by splitting into multiple pages
- User caching for improved performance
- Serverless deployment on Vercel

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Slack Bolt** - Framework for Slack app development
- **Vercel** - Serverless deployment platform
- **pnpm** - Package manager

## Setup

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Enter app name and select your workspace
4. Configure the following settings:

#### OAuth & Permissions
Add these Bot Token Scopes:
- `chat:write`
- `users:read`
- `channels:read`
- `groups:read`
- `im:read`
- `mpim:read`

#### Interactivity & Shortcuts
1. Enable Interactivity
2. Set Request URL to: `https://your-app.vercel.app/api/slack/events`
3. Create a Global Shortcut:
   - Name: `Share to Cosense`
   - Short Description: `Convert thread to Cosense page`
   - Callback ID: `share`

### 2. Environment Variables

Set these environment variables in Vercel:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_USER_TOKEN=xoxp-your-user-token
```

### 3. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/slack2cosense.git
cd slack2cosense

# Install dependencies
pnpm install

# Start local development
pnpm dev
```

### 4. Local Development

```bash
# Start Vercel development server
pnpm dev

# The app will be available at http://localhost:3000
# Use a tunneling service like ngrok to expose your local server to Slack:
# ngrok http 3000
```

Update your Slack app's Request URL to the ngrok URL:
`https://your-ngrok-url.ngrok.io/api/slack/events`

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/slack2cosense)

Or manually:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy to Vercel
vercel --prod
```

### Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `SLACK_USER_TOKEN`

### Update Slack App Configuration

After deployment, update your Slack app's Request URL to:
`https://your-app.vercel.app/api/slack/events`

## Usage

1. Open any Slack thread
2. Click the "Share to Cosense" shortcut (⚡ icon in the message actions)
3. The app will process the thread and send you Cosense links

## Project Structure

```
├── api/
│   └── slack/
│       └── events.ts          # Slack Bolt app handler
├── src/
│   ├── cosense.ts            # Core logic for Cosense conversion
│   └── types.ts              # TypeScript type definitions
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## How It Works

1. **Shortcut Trigger**: User clicks the "Share to Cosense" shortcut
2. **Thread Processing**: App fetches all messages in the thread
3. **User Information**: Retrieves user display names (with caching)
4. **Message Formatting**: Converts messages to Cosense-compatible format
5. **URL Generation**: Creates Cosense page URLs with pre-filled content
6. **Response**: Sends formatted links back to the user

## Performance Optimizations

- **User Caching**: Stores user information in memory to reduce API calls
- **Parallel Processing**: Fetches user information concurrently
- **Content Splitting**: Automatically splits long content into multiple pages
- **Error Handling**: Graceful error handling with user feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
