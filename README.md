# Claude Web

Web frontend wrapper for Claude Code CLI. Double-click `start.bat` to launch.

## Quick Start

1. Ensure [Claude Code](https://docs.anthropic.com/en/docs/claude-code) is installed and authenticated
2. Double-click `start.bat`
3. Browser opens at `http://localhost:3000`

## Features

- Chat interface with streaming responses
- Multi-turn conversation with context (uses Claude's `--name`/`--resume`)
- Markdown rendering with code syntax highlighting
- Thinking block toggle (collapsed by default)
- Tool use display (expandable)
- Conversation history (saved as local JSON files)
- All permissions auto-bypassed (`--dangerously-skip-permissions`)

## Manual Start

```bash
cd D:\coding\claude-web
npm install
npm start
```

Then open `http://localhost:3000`.

## Configuration

Edit `server.js` to adjust:
- `PORT` (default: 3000)
- `MAX_CONCURRENT` (default: 3)
- `REQUEST_TIMEOUT_MS` (default: 10 minutes)