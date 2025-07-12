# slack2cosense

Slack app to transfer threads on Slack to Cosense

## Features

- Transfer Slack threads to Cosense with proper formatting
- Preserve message timestamps and user information
- Handle long threads by splitting into multiple Cosense links
- TypeScript support for better type safety and development experience

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create a `.env` file with the following variables:
   ```
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_USER_TOKEN=xoxp-your-user-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here
   PORT=3000
   ```

3. Configure your Cosense project name in `src/cosense.ts`

## Development

```bash
# Development with auto-reload
pnpm dev

# Start the application
pnpm start

# Type checking
pnpm tsc --noEmit

# Build TypeScript
pnpm build
```

## Architecture

- `src/index.ts` - Main Slack app setup and shortcut handling
- `src/cosense.ts` - Core logic for formatting and generating Cosense links
- `src/types.ts` - TypeScript type definitions

## Usage

1. Install the Slack app in your workspace
2. Use the "share" shortcut on any message or thread
3. The app will send you a private message with Cosense links
4. Click the links to create formatted pages in Cosense

## Type Safety

The TypeScript version provides:
- Strong typing for Slack API responses
- Better error handling and validation
- Improved IDE support with autocomplete
- Runtime error prevention
