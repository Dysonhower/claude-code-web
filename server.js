const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn, exec } = require('child_process');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_PATH = 'claude'; // auto-resolved via PATH, uses shell:true for cross-platform
const MAX_CONCURRENT = 3;
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Track SSE clients and active requests per conversation
const sseClients = new Map();   // convId -> Set<response>
const activeRequests = new Map(); // convId -> ChildProcess

// Ensure data directories exist
const DATA_DIR = path.join(__dirname, 'data', 'conversations');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ── Conversation CRUD ──

function convPath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function loadConversation(id) {
  const p = convPath(id);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveConversation(conv) {
  fs.writeFileSync(convPath(conv.id), JSON.stringify(conv, null, 2), 'utf-8');
}

// GET /api/conversations - list all conversations
app.get('/api/conversations', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const conversations = files.map(f => {
    const conv = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
    return {
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length,
    };
  });
  conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  res.json({ conversations });
});

// POST /api/conversations - create new conversation
app.post('/api/conversations', (req, res) => {
  const { title } = req.body || {};
  const conv = {
    id: crypto.randomUUID(),
    title: title || 'New Conversation',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveConversation(conv);
  res.status(201).json(conv);
});

// GET /api/conversations/:id - get conversation details
app.get('/api/conversations/:id', (req, res) => {
  const conv = loadConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conv);
});

// DELETE /api/conversations/:id - delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  const p = convPath(req.params.id);
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'Conversation not found' });
  fs.unlinkSync(p);
  res.json({ success: true });
});

// ── SSE helper ──

function broadcastSSE(convId, data) {
  const clients = sseClients.get(convId);
  if (!clients) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

function closeSSE(convId) {
  const clients = sseClients.get(convId);
  if (!clients) return;
  for (const res of clients) {
    res.end();
  }
  sseClients.delete(convId);
}

// GET /api/conversations/:id/stream - SSE endpoint
app.get('/api/conversations/:id/stream', (req, res) => {
  const { id } = req.params;
  if (!loadConversation(id)) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');

  if (!sseClients.has(id)) {
    sseClients.set(id, new Set());
  }
  sseClients.get(id).add(res);

  req.on('close', () => {
    const clients = sseClients.get(id);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(id);
    }
  });
});

// POST /api/conversations/:id/send - send a message
app.post('/api/conversations/:id/send', async (req, res) => {
  const { id } = req.params;
  const { prompt } = req.body || {};

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const conv = loadConversation(id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  // Concurrency guard
  if (activeRequests.has(id)) {
    return res.status(409).json({ error: 'A request is already in progress for this conversation' });
  }

  // Global concurrency limit
  if (activeRequests.size >= MAX_CONCURRENT) {
    return res.status(429).json({ error: 'Too many active requests. Please wait.' });
  }

  // Auto-title: use first message as title
  if (conv.messages.length === 0) {
    conv.title = prompt.trim().substring(0, 50);
    saveConversation(conv);
  }

  // Add user message
  conv.messages.push({ role: 'user', content: prompt.trim(), timestamp: Date.now() });
  conv.updatedAt = Date.now();
  saveConversation(conv);

  // Build Claude CLI arguments
  const isFirstMessage = conv.messages.length === 1; // only the user message we just added
  const sessionName = `web-conv-${id}`;
  const args = [
    '--print',
    '--dangerously-skip-permissions',
    '--verbose',
    '--output-format', 'stream-json',
    '--include-partial-messages',
  ];
  if (isFirstMessage) {
    args.push('--name', sessionName);
  } else {
    args.push('--resume', sessionName);
  }
  args.push('--', prompt.trim());

  console.log(`[claude] spawning: claude ${args.join(' ')}`);

  const claude = spawn(CLAUDE_PATH, args, {
    shell: true,
    cwd: process.cwd(),
    env: { ...process.env },
  });

  activeRequests.set(id, claude);

  const rl = readline.createInterface({ input: claude.stdout });
  let fullText = '';
  let isComplete = false;

  rl.on('line', (line) => {
    try {
      const event = JSON.parse(line);
      broadcastSSE(id, event);

      // Accumulate text from text_delta events
      if (event.type === 'stream_event' && event.event?.delta?.type === 'text_delta') {
        fullText += event.event.delta.text;
      }
      if (event.type === 'result') {
        isComplete = true;
      }
    } catch (e) {
      // Non-JSON line (e.g. raw stderr mixed in), ignore
    }
  });

  let stderrOutput = '';
  claude.stderr.on('data', (data) => {
    stderrOutput += data.toString();
  });

  claude.on('close', (code) => {
    activeRequests.delete(id);

    // Save assistant message
    const finalText = fullText || '(no response)';
    conv.messages.push({ role: 'assistant', content: finalText, timestamp: Date.now() });
    conv.updatedAt = Date.now();
    saveConversation(conv);

    // Notify SSE clients
    broadcastSSE(id, { type: 'done', code, text: finalText });
    closeSSE(id);

    if (stderrOutput) {
      console.error(`[claude stderr] ${stderrOutput}`);
    }

    // Send HTTP response
    if (!res.headersSent) {
      res.json({ success: code === 0, message: conv.messages[conv.messages.length - 1], exitCode: code });
    }
  });

  claude.on('error', (err) => {
    activeRequests.delete(id);
    broadcastSSE(id, { type: 'error', message: err.message });
    closeSSE(id);
    console.error(`[claude error] ${err.message}`);
  });

  // Timeout safety
  const timeout = setTimeout(() => {
    if (!isComplete && activeRequests.has(id)) {
      console.log(`[claude] timeout, killing process for conv ${id}`);
      const proc = activeRequests.get(id);
      if (proc) {
        if (os.platform() === 'win32') {
          exec(`taskkill /PID ${proc.pid} /T /F`);
        } else {
          process.kill(-proc.pid, 'SIGTERM');
        }
      }
      activeRequests.delete(id);
      broadcastSSE(id, { type: 'error', message: 'Request timed out' });
      closeSSE(id);

      conv.messages.push({ role: 'assistant', content: '(request timed out)', timestamp: Date.now() });
      conv.updatedAt = Date.now();
      saveConversation(conv);
    }
  }, REQUEST_TIMEOUT_MS);

  // Clean up timeout if process exits normally
  claude.on('close', () => clearTimeout(timeout));
});

// Start server
app.listen(PORT, () => {
  console.log(`Claude Web running at http://localhost:${PORT}`);
});