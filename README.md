# Slack to Cosense

A Slack app that converts Slack threads to Cosense pages using message shortcuts.

## Features

- Convert Slack threads to Cosense pages with a single message shortcut
- Automatically format messages with user information and timestamps
- Handle long content by splitting into multiple pages
- User caching for improved performance
- Serverless deployment on Vercel

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Axios** - HTTP client for Slack API calls
- **Moment.js/Moment-timezone** - Date and time formatting
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
2. Set Request URL to: `https://your-app.vercel.app/api/actions`
3. Create a Message Shortcut. Example:
   - Name: `Share to Cosense`
   - Short Description: `Convert thread to Cosense page`
   - Callback ID: `share`

### 2. Environment Variables

Set these environment variables in Vercel:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_USER_TOKEN=xoxp-your-user-token
COSENSE_PROJECT_NAME=your-cosense-project-name
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
# Option 1: Start with Vercel development server (recommended)
vercel dev

# Option 2: Start with pnpm (requires .env file for environment variables)
pnpm dev

# The app will be available at http://localhost:3000
# Use a tunneling service like ngrok to expose your local server to Slack:
# npx ngrok http 3000
```

Update your Slack app's Request URL to the ngrok URL:
`https://your-ngrok-url.ngrok.io/api/actions`

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
   - `COSENSE_PROJECT_NAME`

### Update Slack App Configuration

After deployment, update your Slack app's Request URL to:
`https://your-app.vercel.app/api/actions`

## Usage

1. Open any Slack message or thread
2. Click the "Share to Cosense" message shortcut (⚡ icon in the message actions)
3. The app will process the thread and send you Cosense page links

## Project Structure

```
├── api/
│   └── actions/
│       ├── index.ts                     # Main Vercel serverless function
│       ├── handlers/
│       │   ├── index.ts                 # Message action router
│       │   └── handleShareAction.ts     # Share action handler
│       └── lib/
│           ├── requestParser.ts         # Request parsing utilities
│           ├── responseHelpers.ts       # Response helper functions
│           ├── slackResponse.ts         # Slack response utilities
│           └── validation.ts            # Signature verification
├── src/
│   └── cosense.ts                       # Core logic for Cosense conversion
├── types/
│   ├── index.ts                         # General type definitions
│   ├── cosense.ts                       # Cosense-related types
│   └── slack.ts                         # Slack API types
├── vercel.json                          # Vercel configuration
├── package.json                         # Dependencies and scripts
└── tsconfig.json                        # TypeScript configuration
```

## How It Works

1. **Message Shortcut**: User clicks the "Share to Cosense" message shortcut
2. **Request Handling**: Vercel function at `/api/actions` receives the request
3. **Signature Verification**: Validates the request using Slack's signing secret
4. **Thread Processing**: Fetches all messages in the thread using Slack API
5. **User Information**: Retrieves user display names with caching for performance
6. **Message Formatting**: Converts messages to Cosense-compatible format with timestamps and links
7. **URL Generation**: Creates Cosense page URLs with pre-filled content
8. **Content Splitting**: Automatically splits long content into multiple pages if needed
9. **Response**: Sends formatted Cosense links back to the user

## Performance Optimizations

- **User Caching**: Stores user information in memory to reduce API calls
- **Parallel Processing**: Fetches user information concurrently
- **Content Splitting**: Automatically splits long content into multiple pages
- **Error Handling**: Graceful error handling with user feedback
- **Signature Verification**: Efficient request validation

## API Endpoints

- `GET /api/actions` - Health check endpoint
- `POST /api/actions` - Main endpoint for Slack message actions and URL verification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
