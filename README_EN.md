# Claude Web

[中文文档](README.md)

A web frontend wrapper for Claude Code CLI, providing a browser interface to interact with Claude.

## Features

- 🗣️ **Conversation Management** — Create, switch, and delete multiple conversations
- 📡 **Real-time Streaming** — SSE-based live display of Claude responses
- 🛠️ **Tool Call Visualization** — Show tools executed by Claude and their results
- 🧠 **Thinking Block Display** — Collapsible thinking process visualization
- ⏹️ **Stop Generation** — Abort long-running requests at any time
- 🐱 **Desktop Pet System** — Interactive character pets synced with Claude tasks

## Security Notice

⚠️ **This project runs Claude CLI with `--dangerously-skip-permissions` flag, bypassing all tool permission checks.**

Recommended for local development only. Do not expose to public networks.

## Quick Start

### Install Dependencies

```bash
cd [your claude web location]
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

---

## Pet System

The desktop pet is a unique feature that provides an interactive character synced with SSE event stream during Claude tasks.

### Available Characters

| Character | Source | Personality |
|-----------|--------|-------------|
| Killua (奇犽) | Hunter × Hunter | Assassin background, confident and calm |
| Ayanami Rei (绫波丽) | Neon Genesis Evangelion | EVA pilot, quiet, emotionless |

### State Machine

Each character has 6 states triggered by SSE events:

| State | Trigger | Animation | Bubble Chance |
|-------|---------|-----------|---------------|
| idle | Default/Idle | Breathing | 60% (every ~10s) |
| thinking | Task start, tool call | Head tilt | **100%** |
| talking | Text output | Bobbing | — |
| happy | Task complete | Bouncing | **100%** |
| sad | Depressed | None | — |
| error | Failure | Shaking | **100%** |

### Bubble System

- **Position**: Fixed above pet head, centered
- **Duration**: 6 seconds before fade out
- **Frequency**:
  - Non-idle states (task-related): **100%** always show
  - Idle state: Average every **10 seconds**, 60% chance to show
- **Overlap**: New bubble replaces existing one
- **Drag Sync**: Bubble position follows pet during drag

### SSE Event Flow

```javascript
// pet.js core events
switch (event.type) {
  case '_send_start':  // Send message → thinking + bubble
  case 'stream_event': // text_delta → talking; tool_use → thinking + bubble
  case 'result':       // Complete → happy + bubble
  case 'done':         // End → idle
  case 'error':        // Error → error + bubble
}
```

### File Structure

```
public/pet/
├── pet.js             # Main controller: state, events, drag, bubbles
└── images/
    ├── killua/        # Killua character images
    │   ├── killua_idle.png
    │   ├── killua_thinking.png
    │   ├── killua_talking.png
    │   ├── killua_happy.png
    │   ├── killua_sad.png
    │   └── killua_error.png
    └── ayanami/       # Ayanami Rei character images
        ├── ayanami_idle.png
        ├── ayanami_thinking.png
        ├── ayanami_talking.png
        ├── ayanami_happy.png
        ├── ayanami_sad.png
        └── ayanami_error.png
```

### Adding New Characters

1. Add character data in `pet.js`:

```javascript
var newCharacter = {
  id: 'character_id',
  name: 'Character Name',
  basePath: '/pet/images/character_id/',
  states: {
    idle:     { image: 'character_idle.png',     animClass: 'pet-anim-breathe' },
    thinking: { image: 'character_thinking.png', animClass: 'pet-anim-tilt' },
    talking:  { image: 'character_talking.png',  animClass: 'pet-anim-bob' },
    happy:    { image: 'character_happy.png',    animClass: 'pet-anim-bounce' },
    sad:      { image: 'character_sad.png',      animClass: '' },
    error:    { image: 'character_error.png',    animClass: 'pet-anim-shake' }
  },
  lines: {
    onThinking: ['Line 1', 'Line 2', ...],
    onTool: function(t) { return 'Using ' + t; },
    onDone: ['Done line 1', ...],
    onError: ['Error line 1', ...],
    idle: ['Idle line 1', ...]
  }
};

registry.character_id = newCharacter;
```

2. Upload 6 PNG images (recommended: 280×320 pixels)

3. Add to dropdown menu in `index.html`:

```html
<button data-pet="character_id">Character Name 🌸</button>
```

### User Interaction

- **Select Character**: Click "🐾 Pet" button in header, choose from dropdown
- **Drag to Move**: Hold and drag character, position saved to localStorage
- **Double-click Reset**: Return character to default position
- **Disable Pet**: Choose "关闭" option, persists across sessions

---

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
│   ├── app.js          # Frontend logic (SSE handling)
│   ├── style.css       # Stylesheet
│   └── pet/            # Pet system
│       ├── pet.js      # Pet controller
│       └── images/     # Character images
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