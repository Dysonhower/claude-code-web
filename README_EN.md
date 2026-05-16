# Claude Web

A web frontend wrapper for Claude Code CLI, providing a browser interface to interact with Claude.

## Features

- 🗣️ **Conversation Management** — Create, switch, and delete multiple conversations
- 📡 **Real-time Streaming** — SSE-based live display of Claude responses
- 🛠️ **Tool Call Visualization** — Show tools executed by Claude and their results
- 🧠 **Thinking Block Display** — Collapsible thinking process visualization
- ⏹️ **Stop Generation** — Abort long-running requests at any time
- 📊 **Token Statistics** — Display input/output token count for each response

## Security Notice

⚠️ **This project runs Claude CLI with `--dangerously-skip-permissions` flag, bypassing all tool permission checks.**

Recommended for local development only. Do not expose to public networks.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Start Service

```bash
npm start
# Or double-click start.bat (Windows)
```

Access http://localhost:3000 after startup.

### Prerequisites

- Node.js 18+
- Claude Code CLI installed with API key configured

## Security Hardening

This project implements the following security measures:

| Category | Fix |
|----------|-----|
| Network Isolation | Listen on `127.0.0.1`, reject external access |
| Command Execution | `shell: false` + cross-spawn, prevent command injection |
| Path Security | UUID regex validation, prevent path traversal attacks |
| XSS Protection | DOMPurify replaces regex blacklist, prevent malicious HTML |
| Process Management | finalize convergence function, prevent duplicate responses; detached process group, ensure kill works on Linux |
| Data Safety | JSON temp file + rename, prevent data corruption from interrupted writes |

## Project Structure

```
claude-web/
├── server.js           # Express backend service
├── package.json        # Project dependencies
├── start.bat           # Windows startup script
├── public/
│   ├── index.html      # Main page
│   ├── app.js          # Frontend logic
│   └── style.css       # Stylesheet
└── data/
    └── conversations/  # Conversation data storage (JSON)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/conversations` | GET | List all conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/:id` | GET | Get conversation details |
| `/api/conversations/:id` | DELETE | Delete conversation |
| `/api/conversations/:id/stream` | GET | SSE event stream |
| `/api/conversations/:id/send` | POST | Send message |
| `/api/conversations/:id/abort` | POST | Stop generation |

## Configuration

Configure via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Service port |

## License

MIT License