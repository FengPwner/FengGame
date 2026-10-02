// ── Keyboard ──────────────────────────────────────────────────────────────

var KEY_MAP = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };

document.addEventListener('keydown', function(e) {
  if (typeof phase !== 'undefined' && phase === 'paused') return; 

  var action = KEY_MAP[e.keyCode];
  if (!action) return;
  e.preventDefault();

  if (phase !== 'running' && phase !== 'paused') { start(); return; }

  if (action === 'left'  && dir.x === 0) nextDir = { x: -1, y:  0 };
  if (action === 'right' && dir.x === 0) nextDir = { x:  1, y:  0 };
  if (action === 'up'    && dir.y === 0) nextDir = { x:  0, y: -1 };
  if (action === 'down'  && dir.y === 0) nextDir = { x:  0, y:  1 };
});

// ── Touch / swipe ─────────────────────────────────────────────────────────

var touchStart = null;

canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  var t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  if (!touchStart) return;

  var t  = e.changedTouches[0];
  var dx = t.clientX - touchStart.x;
  var dy = t.clientY - touchStart.y;
  touchStart = null;

  if (phase !== 'running' && phase !== 'paused') { start(); return; }

  // Ignore taps — require a real swipe
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0 && dir.x === 0) nextDir = { x:  1, y: 0 };
    if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
  } else {
    if (dy > 0 && dir.y === 0) nextDir = { x: 0, y:  1 };
    if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
  }
}, { passive: false });
