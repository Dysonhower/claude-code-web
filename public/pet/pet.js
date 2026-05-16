// Pet system main controller (ES module)
import killua from './killua.js';

// Character registry - easy to add new characters
const registry = {
  killua: killua
};

// Pet singleton state
const pet = {
  active: null,       // current character id
  char: null,         // current character module
  state: 'idle',      // current state name
  stage: null,        // DOM element #petStage
  position: { x: null, y: null }, // drag position
  lastBubble: '',     // last bubble text (prevent repeats)
  idleTimer: null,    // idle action timer
  _textDeltaSeen: false
};

// Default position (right bottom)
const defaultPos = () => ({
  x: window.innerWidth - 164,
  y: window.innerHeight - 184
});

// Clamp position to viewport
function clampPos(x, y) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const stageW = 140;
  const stageH = 160;
  return {
    x: Math.max(0, Math.min(w - stageW, x)),
    y: Math.max(0, Math.min(h - stageH, y))
  };
}

// Load saved position from localStorage
function loadPosition() {
  try {
    const saved = localStorage.getItem('pet.position');
    if (saved) {
      const pos = JSON.parse(saved);
      return clampPos(pos.x, pos.y);
    }
  } catch (e) {}
  return defaultPos();
}

// Save position to localStorage
function savePosition(pos) {
  try {
    localStorage.setItem('pet.position', JSON.stringify(pos));
  } catch (e) {}
}

// Render current state SVG to stage
function render() {
  if (!pet.stage || !pet.char) return;
  const stateData = pet.char.states[pet.state];
  if (!stateData) return;

  pet.stage.innerHTML = stateData.svg;
  pet.stage.className.baseVal = 'pet-stage';
  if (stateData.animClass) {
    pet.stage.classList.add(stateData.animClass);
  }

  // Apply position
  if (pet.position.x !== null && pet.position.y !== null) {
    pet.stage.style.right = 'auto';
    pet.stage.style.bottom = 'auto';
    pet.stage.style.left = pet.position.x + 'px';
    pet.stage.style.top = pet.position.y + 'px';
  }
}

// Pick random item from array or call function
function randomLine(lines) {
  if (typeof lines === 'function') return lines();
  if (!Array.isArray(lines) || lines.length === 0) return '';
  return lines[Math.floor(Math.random() * lines.length)];
}

// Show bubble text near pet
function say(text) {
  if (!pet.stage || !text) return;
  // Prevent repeat within 1s
  if (text === pet.lastBubble) return;
  pet.lastBubble = text;

  // Create bubble
  const bubble = document.createElement('div');
  bubble.className = 'pet-bubble';
  bubble.textContent = text;

  // Position: above and left of stage
  const stageRect = pet.stage.getBoundingClientRect();
  bubble.style.left = Math.max(10, stageRect.left - 20) + 'px';
  bubble.style.top = Math.max(10, stageRect.top - 50) + 'px';

  document.body.appendChild(bubble);

  // Fade out after 3.5s
  setTimeout(() => {
    bubble.classList.add('fade-out');
    setTimeout(() => bubble.remove(), 300);
  }, 3500);

  setTimeout(() => {
    if (pet.lastBubble === text) pet.lastBubble = '';
  }, 1000);
}

// Set pet state
function setState(name) {
  if (!pet.char || !pet.char.states[name]) return;
  pet.state = name;
  render();
}

// Idle random actions
function scheduleIdleAction() {
  if (pet.idleTimer) clearTimeout(pet.idleTimer);
  if (!pet.active || pet.state !== 'idle') return;

  // Random interval 30-90s
  const delay = 30000 + Math.random() * 60000;
  pet.idleTimer = setTimeout(() => {
    if (pet.state !== 'idle') return;
    // Pick random action: blink (rerender), talk, or jump
    const action = Math.random();
    if (action < 0.3) {
      // Blink - briefly change eyes
      render();
    } else if (action < 0.6) {
      // Say idle line
      say(randomLine(pet.char.lines.idle));
    } else {
      // Small bounce
      pet.stage.classList.add('pet-anim-bounce');
      setTimeout(() => pet.stage.classList.remove('pet-anim-bounce'), 500);
    }
    scheduleIdleAction();
  }, delay);
}

// Handle SSE stream events
function onStreamEvent(event) {
  if (!pet.active || !pet.char) return;

  switch (event.type) {
    case '_send_start':
      pet._textDeltaSeen = false;
      setState('thinking');
      say(randomLine(pet.char.lines.onThinking));
      break;

    case 'stream_event':
      const delta = event.event?.delta;
      if (delta?.type === 'thinking_delta') {
        // Already thinking
      } else if (delta?.type === 'text_delta' && !pet._textDeltaSeen) {
        pet._textDeltaSeen = true;
        setState('talking');
      }

      // Tool use
      if (event.event?.type === 'content_block_start') {
        const block = event.event.content_block;
        if (block?.type === 'tool_use') {
          setState('thinking');
          say(pet.char.lines.onTool(block.name));
        }
      }
      break;

    case 'result':
      const usage = event.usage || event.message?.usage || event.result?.usage;
      if (usage) {
        setState('happy');
        setTimeout(() => setState('idle'), 2000);
      }
      break;

    case 'done':
      setState('idle');
      say(randomLine(pet.char.lines.onDone));
      scheduleIdleAction();
      break;

    case 'error':
      setState('error');
      say(randomLine(pet.char.lines.onError));
      setTimeout(() => setState('idle'), 2000);
      scheduleIdleAction();
      break;
  }
}

// Load a character
function load(charId) {
  if (charId === 'off') {
    unload();
    return;
  }

  const char = registry[charId];
  if (!char) return;

  pet.active = charId;
  pet.char = char;
  pet.state = 'idle';
  pet.position = loadPosition();

  pet.stage = document.getElementById('petStage');
  pet.stage.hidden = false;
  render();

  // Setup drag
  setupDrag();

  // Start idle
  scheduleIdleAction();

  // Persist choice
  try {
    localStorage.setItem('pet.active', charId);
  } catch (e) {}
}

// Unload current pet
function unload() {
  if (pet.idleTimer) clearTimeout(pet.idleTimer);
  pet.active = null;
  pet.char = null;
  pet.state = 'idle';

  if (pet.stage) {
    pet.stage.hidden = true;
    pet.stage.innerHTML = '';
  }

  // Remove any bubbles
  document.querySelectorAll('.pet-bubble').forEach(b => b.remove());

  try {
    localStorage.setItem('pet.active', 'off');
  } catch (e) {}
}

// Setup drag functionality
function setupDrag() {
  if (!pet.stage) return;

  let dragging = false;
  let startX, startY;

  pet.stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    pet.stage.classList.add('dragging');
    pet.stage.setPointerCapture(e.pointerId);
    startX = e.clientX - pet.position.x;
    startY = e.clientY - pet.position.y;
  });

  pet.stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    requestAnimationFrame(() => {
      const pos = clampPos(e.clientX - startX, e.clientY - startY);
      pet.position = pos;
      pet.stage.style.left = pos.x + 'px';
      pet.stage.style.top = pos.y + 'px';
    });
  });

  pet.stage.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    pet.stage.classList.remove('dragging');
    pet.stage.releasePointerCapture(e.pointerId);
    savePosition(pet.position);
  });

  // Double-click to reset position
  pet.stage.addEventListener('dblclick', () => {
    pet.position = defaultPos();
    pet.stage.style.left = pet.position.x + 'px';
    pet.stage.style.top = pet.position.y + 'px';
    savePosition(pet.position);
    render();
  });
}

// Handle window resize - clamp position
function onResize() {
  if (!pet.active || !pet.stage) return;
  const pos = clampPos(pet.position.x, pet.position.y);
  if (pos.x !== pet.position.x || pos.y !== pet.position.y) {
    pet.position = pos;
    pet.stage.style.left = pos.x + 'px';
    pet.stage.style.top = pos.y + 'px';
    savePosition(pos);
  }
}

// Initialize on module load
function init() {
  // Check localStorage for saved pet
  let savedPet = 'killua';
  try {
    const saved = localStorage.getItem('pet.active');
    if (saved === 'off') savedPet = 'off';
    else if (saved && registry[saved]) savedPet = saved;
  } catch (e) {}

  // Setup selector UI
  const btn = document.getElementById('petSelectorBtn');
  const menu = document.getElementById('petSelectorMenu');

  btn.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
  });

  menu.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      const petId = b.dataset.pet;
      load(petId);
      menu.hidden = true;

      // Update active state in menu
      menu.querySelectorAll('button').forEach(bb => {
        bb.style.fontWeight = bb.dataset.pet === petId ? '600' : 'normal';
      });
    });
  });

  // Close menu on click outside
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.hidden = true;
    }
  });

  // Window resize handler
  window.addEventListener('resize', onResize);

  // Load saved pet
  if (savedPet !== 'off') {
    // Mark active in menu
    menu.querySelector(`button[data-pet="${savedPet}"]`)?.style.fontWeight = '600';
    load(savedPet);
  } else {
    // Mark 'off' active
    menu.querySelector('button[data-pet="off"]').style.fontWeight = '600';
  }
}

// Export to window for app.js access
window.pet = {
  load,
  unload,
  say,
  setState,
  onStreamEvent
};

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}