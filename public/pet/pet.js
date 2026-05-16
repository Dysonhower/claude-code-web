// Pet system main controller
(function() {
  // ── Killua character data (16-bit pixel art style) ──
  const killua = {
    id: 'killua',
    name: '奇犽',
    states: {
      idle: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <rect x="12" y="8" width="3" height="3" fill="#333"/>
  <rect x="17" y="8" width="3" height="3" fill="#333"/>
  <rect x="14" y="12" width="4" height="1" fill="#333"/>
</svg>`,
        animClass: 'pet-anim-breathe'
      },
      thinking: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="11" y="3" width="12" height="12" fill="#fce8d5"/>
  <rect x="9" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="7" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="23" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="11" y="0" width="2" height="2" fill="#fff"/>
  <rect x="21" y="0" width="2" height="2" fill="#fff"/>
  <rect x="15" y="0" width="4" height="2" fill="#fff"/>
  <rect x="13" y="6" width="3" height="3" fill="#333"/>
  <rect x="18" y="6" width="3" height="3" fill="#333"/>
  <rect x="15" y="11" width="2" height="1" fill="#333"/>
  <rect x="4" y="16" width="4" height="4" fill="#fce8d5"/>
</svg>`,
        animClass: 'pet-anim-tilt'
      },
      talking: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <rect x="12" y="7" width="3" height="4" fill="#333"/>
  <rect x="17" y="7" width="3" height="4" fill="#333"/>
  <rect x="13" y="12" width="6" height="2" fill="#333"/>
  <rect x="14" y="13" width="4" height="1" fill="#fce8d5"/>
</svg>`,
        animClass: 'pet-anim-bob'
      },
      happy: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="6" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="4" height="6" fill="#e8e8e8"/>
  <rect x="10" y="0" width="2" height="2" fill="#fff"/>
  <rect x="20" y="0" width="2" height="2" fill="#fff"/>
  <rect x="14" y="0" width="4" height="2" fill="#fff"/>
  <rect x="12" y="8" width="3" height="2" fill="#333"/>
  <rect x="17" y="8" width="3" height="2" fill="#333"/>
  <rect x="12" y="12" width="8" height="2" fill="#333"/>
  <rect x="13" y="13" width="6" height="1" fill="#fce8d5"/>
</svg>`,
        animClass: 'pet-anim-bounce'
      },
      sad: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="22" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="20" width="12" height="2" fill="#fff"/>
  <rect x="6" y="30" width="20" height="6" fill="#333"/>
  <rect x="6" y="36" width="6" height="4" fill="#6b5b95"/>
  <rect x="20" y="36" width="6" height="4" fill="#6b5b95"/>
  <rect x="10" y="6" width="12" height="12" fill="#fce8d5"/>
  <rect x="8" y="2" width="16" height="4" fill="#ccc"/>
  <rect x="6" y="4" width="4" height="6" fill="#ccc"/>
  <rect x="22" y="4" width="4" height="6" fill="#ccc"/>
  <rect x="12" y="10" width="3" height="3" fill="#333"/>
  <rect x="17" y="10" width="3" height="3" fill="#333"/>
  <rect x="14" y="14" width="4" height="1" fill="#333"/>
</svg>`,
        animClass: ''
      },
      error: {
        svg: `<svg viewBox="0 0 32 40" style="background:none">
  <rect x="8" y="20" width="16" height="8" fill="#6b5b95"/>
  <rect x="10" y="18" width="12" height="2" fill="#fff"/>
  <rect x="6" y="28" width="20" height="6" fill="#333"/>
  <rect x="6" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="20" y="34" width="6" height="6" fill="#6b5b95"/>
  <rect x="10" y="4" width="12" height="12" fill="#fce8d5"/>
  <rect x="8" y="0" width="16" height="4" fill="#e8e8e8"/>
  <rect x="4" y="2" width="6" height="6" fill="#e8e8e8"/>
  <rect x="22" y="2" width="6" height="6" fill="#e8e8e8"/>
  <rect x="12" y="7" width="1" height="1" fill="#333"/>
  <rect x="14" y="9" width="1" height="1" fill="#333"/>
  <rect x="17" y="7" width="1" height="1" fill="#333"/>
  <rect x="19" y="9" width="1" height="1" fill="#333"/>
  <rect x="13" y="8" width="1" height="1" fill="#333"/>
  <rect x="18" y="8" width="1" height="1" fill="#333"/>
  <rect x="13" y="12" width="6" height="2" fill="#333"/>
</svg>`,
        animClass: 'pet-anim-shake'
      }
    },
    lines: {
      onThinking: ['让我想想…', '嗯…', '有意思…'],
      onTool: function(t) { return '用一下 ' + t + '…'; },
      onDone: ['好了，很轻松嘛！', '搞定了，不用谢我。', '朋友帮朋友，理所当然的。'],
      onError: ['就这？再来！', '出问题了，再试一次。', '呃，失败了。'],
      idle: ['有些问题不能问出来，一旦问出来，就阻止不了了。', '无聊…', '想吃巧克力机器人了。', '杀手家族出身，不过现在只想和朋友在一起。']
    }
  };

  // Character registry
  var registry = { killua: killua };

  // Pet singleton state
  var petState = {
    active: null,
    char: null,
    state: 'idle',
    stage: null,
    position: { x: null, y: null },
    lastBubble: '',
    idleTimer: null,
    textDeltaSeen: false
  };

  // Default position (right bottom)
  function defaultPos() {
    return {
      x: window.innerWidth - 164,
      y: window.innerHeight - 184
    };
  }

  // Clamp position to viewport
  function clampPos(x, y) {
    return {
      x: Math.max(0, Math.min(window.innerWidth - 140, x)),
      y: Math.max(0, Math.min(window.innerHeight - 160, y))
    };
  }

  // Load saved position
  function loadPosition() {
    try {
      var saved = localStorage.getItem('pet.position');
      if (saved) return clampPos(JSON.parse(saved).x, JSON.parse(saved).y);
    } catch (e) {}
    return defaultPos();
  }

  // Save position
  function savePosition(pos) {
    try { localStorage.setItem('pet.position', JSON.stringify(pos)); } catch (e) {}
  }

  // Render current state
  function render() {
    if (!petState.stage || !petState.char) return;
    var stateData = petState.char.states[petState.state];
    if (!stateData) return;

    petState.stage.innerHTML = stateData.svg;
    petState.stage.className = 'pet-stage';
    if (stateData.animClass) petState.stage.classList.add(stateData.animClass);

    if (petState.position.x !== null) {
      petState.stage.style.right = 'auto';
      petState.stage.style.bottom = 'auto';
      petState.stage.style.left = petState.position.x + 'px';
      petState.stage.style.top = petState.position.y + 'px';
    }
  }

  // Random line picker
  function randomLine(lines) {
    if (typeof lines === 'function') return lines();
    if (!Array.isArray(lines) || lines.length === 0) return '';
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // Show bubble
  function say(text) {
    if (!petState.stage || !text || text === petState.lastBubble) return;
    petState.lastBubble = text;

    var bubble = document.createElement('div');
    bubble.className = 'pet-bubble';
    bubble.textContent = text;

    var rect = petState.stage.getBoundingClientRect();
    bubble.style.left = Math.max(10, rect.left - 20) + 'px';
    bubble.style.top = Math.max(10, rect.top - 50) + 'px';

    document.body.appendChild(bubble);

    setTimeout(function() {
      bubble.classList.add('fade-out');
      setTimeout(function() { bubble.remove(); }, 300);
    }, 3500);

    setTimeout(function() { if (petState.lastBubble === text) petState.lastBubble = ''; }, 1000);
  }

  // Set state
  function setState(name) {
    if (!petState.char || !petState.char.states[name]) return;
    petState.state = name;
    render();
  }

  // Idle action scheduler
  function scheduleIdleAction() {
    if (petState.idleTimer) clearTimeout(petState.idleTimer);
    if (!petState.active || petState.state !== 'idle') return;

    var delay = 30000 + Math.random() * 60000;
    petState.idleTimer = setTimeout(function() {
      if (petState.state !== 'idle') return;
      var action = Math.random();
      if (action < 0.3) render();
      else if (action < 0.6) say(randomLine(petState.char.lines.idle));
      else {
        petState.stage.classList.add('pet-anim-bounce');
        setTimeout(function() { petState.stage.classList.remove('pet-anim-bounce'); }, 500);
      }
      scheduleIdleAction();
    }, delay);
  }

  // Handle stream events
  function onStreamEvent(event) {
    if (!petState.active || !petState.char) return;

    var type = event.type;

    switch (type) {
      case '_send_start':
        petState.textDeltaSeen = false;
        setState('thinking');
        say(randomLine(petState.char.lines.onThinking));
        break;

      case 'stream_event':
        var delta = event.event && event.event.delta;
        if (delta && delta.type === 'text_delta' && !petState.textDeltaSeen) {
          petState.textDeltaSeen = true;
          setState('talking');
        }
        // Tool use detection
        var eventType = event.event && event.event.type;
        if (eventType === 'content_block_start') {
          var block = event.event.content_block;
          if (block && block.type === 'tool_use') {
            setState('thinking');
            say(petState.char.lines.onTool(block.name));
          }
        }
        break;

      case 'result':
        setState('happy');
        setTimeout(function() { setState('idle'); }, 2000);
        break;

      case 'done':
        setState('idle');
        say(randomLine(petState.char.lines.onDone));
        scheduleIdleAction();
        break;

      case 'error':
        setState('error');
        say(randomLine(petState.char.lines.onError));
        setTimeout(function() { setState('idle'); }, 2000);
        scheduleIdleAction();
        break;
    }
  }

  // Load character
  function load(charId) {
    if (charId === 'off') { unload(); return; }
    var char = registry[charId];
    if (!char) return;

    petState.active = charId;
    petState.char = char;
    petState.state = 'idle';
    petState.position = loadPosition();

    petState.stage = document.getElementById('petStage');
    if (petState.stage) {
      petState.stage.hidden = false;
      render();
      setupDrag();
    }
    scheduleIdleAction();
    try { localStorage.setItem('pet.active', charId); } catch (e) {}
  }

  // Unload
  function unload() {
    if (petState.idleTimer) clearTimeout(petState.idleTimer);
    petState.active = null;
    petState.char = null;
    petState.state = 'idle';
    if (petState.stage) {
      petState.stage.hidden = true;
      petState.stage.innerHTML = '';
    }
    document.querySelectorAll('.pet-bubble').forEach(function(b) { b.remove(); });
    try { localStorage.setItem('pet.active', 'off'); } catch (e) {}
  }

  // Drag setup
  function setupDrag() {
    if (!petState.stage) return;
    var dragging = false, startX, startY;

    petState.stage.addEventListener('pointerdown', function(e) {
      dragging = true;
      petState.stage.classList.add('dragging');
      petState.stage.setPointerCapture(e.pointerId);
      startX = e.clientX - petState.position.x;
      startY = e.clientY - petState.position.y;
    });

    petState.stage.addEventListener('pointermove', function(e) {
      if (!dragging) return;
      requestAnimationFrame(function() {
        var pos = clampPos(e.clientX - startX, e.clientY - startY);
        petState.position = pos;
        petState.stage.style.left = pos.x + 'px';
        petState.stage.style.top = pos.y + 'px';
      });
    });

    petState.stage.addEventListener('pointerup', function(e) {
      if (!dragging) return;
      dragging = false;
      petState.stage.classList.remove('dragging');
      petState.stage.releasePointerCapture(e.pointerId);
      savePosition(petState.position);
    });

    petState.stage.addEventListener('dblclick', function() {
      petState.position = defaultPos();
      petState.stage.style.left = petState.position.x + 'px';
      petState.stage.style.top = petState.position.y + 'px';
      savePosition(petState.position);
      render();
    });
  }

  // Resize handler
  function onResize() {
    if (!petState.active || !petState.stage) return;
    var pos = clampPos(petState.position.x, petState.position.y);
    if (pos.x !== petState.position.x || pos.y !== petState.position.y) {
      petState.position = pos;
      petState.stage.style.left = pos.x + 'px';
      petState.stage.style.top = pos.y + 'px';
      savePosition(pos);
    }
  }

  // Init
  function init() {
    var savedPet = 'killua';
    try {
      var saved = localStorage.getItem('pet.active');
      if (saved === 'off') savedPet = 'off';
      else if (saved && registry[saved]) savedPet = saved;
    } catch (e) {}

    var btn = document.getElementById('petSelectorBtn');
    var menu = document.getElementById('petSelectorMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });

    menu.querySelectorAll('button').forEach(function(b) {
      b.addEventListener('click', function() {
        var petId = b.dataset.pet;
        load(petId);
        menu.hidden = true;
        menu.querySelectorAll('button').forEach(function(bb) {
          bb.style.fontWeight = bb.dataset.pet === petId ? '600' : 'normal';
        });
      });
    });

    document.addEventListener('click', function(e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.hidden = true;
      }
    });

    window.addEventListener('resize', onResize);

    if (savedPet !== 'off') {
      var activeBtn = menu.querySelector('button[data-pet="' + savedPet + '"]');
      if (activeBtn) activeBtn.style.fontWeight = '600';
      load(savedPet);
    } else {
      menu.querySelector('button[data-pet="off"]').style.fontWeight = '600';
    }
  }

  // Export to window
  window.pet = {
    load: load,
    unload: unload,
    say: say,
    setState: setState,
    onStreamEvent: onStreamEvent
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();