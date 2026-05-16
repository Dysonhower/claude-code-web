const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');
const crossSpawn = require('cross-spawn');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_PATH = 'claude'; // cross-spawn resolves .cmd on Windows without shell
const MAX_CONCURRENT = 3;
const REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Track SSE clients and active requests per conversation
const sseClients = new Map();   // convId -> Set<response>
const activeRequests = new Map(); // convId -> ChildProcess

function killProc(proc) {
  if (os.platform() === 'win32') {
    exec(`taskkill /PID ${proc.pid} /T /F`);
  } else {
    try { process.kill(-proc.pid, 'SIGTERM'); } catch (e) { /* already dead */ }
  }
}

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

const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safePath(id) {
  if (!ID_RE.test(id)) return null;
  return path.join(DATA_DIR, `${id}.json`);
}

function loadConversation(id) {
  const p = safePath(id);
  if (!p || !fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {
    console.error(`[corrupt] ${p}: ${e.message}`);
    return null;
  }
}

function saveConversation(conv) {
  const p = safePath(conv.id);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(conv, null, 2), 'utf-8');
  fs.renameSync(tmp, p);
}

// GET /api/conversations - list all conversations
app.get('/api/conversations', (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const conversations = [];
  for (const f of files) {
    try {
      const conv = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      conversations.push({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
      });
    } catch (e) {
      console.error(`[corrupt] ${f}: ${e.message}`);
    }
  }
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
    sessionStarted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveConversation(conv);
  res.status(201).json(conv);
});

// GET /api/conversations/:id - get conversation details
app.get('/api/conversations/:id', (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID' });
  const conv = loadConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  res.json(conv);
});

// DELETE /api/conversations/:id - delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  const p = safePath(req.params.id);
  if (!p) return res.status(400).json({ error: 'Invalid conversation ID' });
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'Conversation not found' });
  const proc = activeRequests.get(req.params.id);
  if (proc) { killProc(proc); activeRequests.delete(req.params.id); }
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
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid conversation ID' });
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
  if (!ID_RE.test(id)) return res.status(400).json({ error: 'Invalid conversation ID' });
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
  const isFirstMessage = !conv.sessionStarted;
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

  console.log(`[claude] spawn isFirst=${isFirstMessage} promptLen=${prompt.length}`);

  const claude = crossSpawn(CLAUDE_PATH, args, {
    shell: false,
    detached: process.platform !== 'win32',
    cwd: process.cwd(),
    env: process.env,
    windowsHide: true,
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

  let finalized = false;
  function finalize(reason, code) {
    if (finalized) return;
    finalized = true;
    clearTimeout(timeout);
    activeRequests.delete(id);

    const text = reason === 'timeout' ? '(request timed out)'
               : reason === 'error'   ? `(error: ${code})`
               : (fullText || '(no response)');
    conv.messages.push({ role: 'assistant', content: text, timestamp: Date.now() });
    conv.updatedAt = Date.now();
    if (reason === 'ok') conv.sessionStarted = true;
    saveConversation(conv);

    broadcastSSE(id, { type: 'done', code, text });
    closeSSE(id);
    if (!res.headersSent) res.json({ success: reason === 'ok', exitCode: code });
  }

  claude.on('close', (code) => finalize(code === 0 ? 'ok' : 'error', code));
  claude.on('error', (err) => { console.error(err); finalize('error', -1); });
  const timeout = setTimeout(() => {
    console.log(`[claude] timeout, killing process for conv ${id}`);
    const proc = activeRequests.get(id);
    if (proc) {
      killProc(proc);
    }
    finalize('timeout', -1);
  }, REQUEST_TIMEOUT_MS);
});

// POST /api/conversations/:id/abort - stop generation
app.post('/api/conversations/:id/abort', (req, res) => {
  if (!ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID' });
  const proc = activeRequests.get(req.params.id);
  if (proc) killProc(proc);
  res.json({ ok: true });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Claude Web running at http://localhost:${PORT}`);
});