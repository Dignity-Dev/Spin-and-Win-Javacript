const COLORS = [
  '#FF6B35','#FFD700','#FF3F7A','#00C9FF','#7FFF00',
  '#FF69B4','#00E5CC','#FF8C00','#9B59FF','#2ECC71',
  '#E74C3C','#3498DB','#F39C12','#1ABC9C','#8E44AD',
  '#E67E22','#27AE60','#2980B9','#D35400','#16A085'
];

let names = ['Alice','Bob','Carol','David','Eve','Frank'];
let spinning = false;
let currentAngle = 0;
let lastWinner = null;

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const CX = SIZE / 2, CY = SIZE / 2, R = SIZE / 2 - 10;

function getColor(i) { return COLORS[i % COLORS.length]; }

function drawWheel(angle) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (names.length === 0) {
    ctx.fillStyle = '#1a1830';
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a7a9be';
    ctx.font = 'bold 18px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add names to spin!', CX, CY);
    return;
  }

  const slice = (Math.PI * 2) / names.length;

  names.forEach((name, i) => {
    const start = angle + i * slice;
    const end = start + slice;

    // Slice
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, start, end);
    ctx.closePath();
    ctx.fillStyle = getColor(i);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const maxLen = 14;
    const label = name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
    const fontSize = names.length > 12 ? 11 : names.length > 8 ? 13 : 15;
    ctx.font = `bold ${fontSize}px Nunito`;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(label, R - 14 + 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, R - 14, 0);
    ctx.restore();
  });

  // Center cap
  ctx.beginPath();
  ctx.arc(CX, CY, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0e17';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderList() {
  const ul = document.getElementById('namesList');
  ul.innerHTML = '';
  names.forEach((name, i) => {
    const li = document.createElement('li');
    li.className = 'name-item';
    li.innerHTML = `<span class="name-swatch" style="background:${getColor(i)}"></span>
      <span class="name-label">${escHtml(name)}</span>
      <button class="del-btn" onclick="removeName(${i})" title="Remove">×</button>`;
    ul.appendChild(li);
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function addName() {
  const inp = document.getElementById('nameInput');
  const val = inp.value.trim();
  if (!val) return;
  names.push(val);
  inp.value = '';
  renderList();
  drawWheel(currentAngle);
}

function removeName(i) {
  names.splice(i, 1);
  renderList();
  drawWheel(currentAngle);
}

function clearAll() {
  if (names.length === 0) return;
  names = [];
  renderList();
  drawWheel(currentAngle);
  showToast('🗑️ All names cleared');
}

function spin() {
  if (spinning || names.length < 2) return;
  spinning = true;
  document.getElementById('spinBtn').disabled = true;

  const extraSpins = (8 + Math.floor(Math.random() * 6)) * Math.PI * 2;
  const landAngle = Math.random() * Math.PI * 2;
  const totalRotation = extraSpins + landAngle;
  const duration = 4000 + Math.random() * 1500;
  const start = performance.now();
  const startAngle = currentAngle;

  function ease(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
  }

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    currentAngle = startAngle + totalRotation * ease(t);
    drawWheel(currentAngle);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      spinning = false;
      document.getElementById('spinBtn').disabled = false;
      showWinner();
    }
  }
  requestAnimationFrame(frame);
}

function showWinner() {
  // The pointer is at the right side (angle 0 in canvas = right = 3 o'clock)
  // We want the slice at angle 0 (pointing right where the pointer is)
  const slice = (Math.PI * 2) / names.length;
  // Normalize current angle
  const normalized = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  // The pointer points at angle 0 (right side). Find which slice is there.
  // Slice i spans: currentAngle + i*slice to currentAngle + (i+1)*slice
  // We need which slice contains angle 0, i.e., (0 - currentAngle) mod 2pi
  const relAngle = ((0 - normalized) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(relAngle / slice) % names.length;
  lastWinner = idx;

  document.getElementById('winnerName').textContent = names[idx];
  document.getElementById('modal').classList.add('show');
  spawnConfetti();
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  if (document.getElementById('removeWinner').checked && lastWinner !== null) {
    names.splice(lastWinner, 1);
    lastWinner = null;
    renderList();
    drawWheel(currentAngle);
  }
  document.getElementById('confetti').innerHTML = '';
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#ff6b35','#ffd700','#ff3f7a','#00c9ff','#7fff00','#ff69b4'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = Math.random() > 0.5 ? '50%' : '0%';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${-10 - Math.random() * 20}px;
      background: ${color};
      border-radius: ${shape};
      width: ${6 + Math.random() * 10}px;
      height: ${6 + Math.random() * 10}px;
      animation-delay: ${Math.random() * 0.8}s;
      animation-duration: ${2 + Math.random() * 1.5}s;
    `;
    container.appendChild(el);
  }
}


function importPasted() {
  const area = document.getElementById('pasteArea');
  const raw = area.value;
  if (!raw.trim()) return;

  let parsed = [];
  raw.split(/\n/).forEach(function(line) {
    if (line.includes(',') || line.includes('\t')) {
      line.split(/[,\t]/).forEach(function(part) {
        const n = part.trim();
        if (n) parsed.push(n);
      });
    } else {
      const n = line.trim();
      if (n) parsed.push(n);
    }
  });

  if (parsed.length === 0) return;

  const existing = new Set(names.map(function(n) { return n.toLowerCase(); }));
  const added = [];
  parsed.forEach(function(n) {
    if (!existing.has(n.toLowerCase())) {
      names.push(n);
      existing.add(n.toLowerCase());
      added.push(n);
    }
  });

  area.value = '';
  renderList();
  drawWheel(currentAngle);

  if (added.length > 0) {
    showToast('\u2705 Added ' + added.length + ' name' + (added.length > 1 ? 's' : ''));
  } else {
    showToast('\u26a0\ufe0f All names already on the wheel');
  }
}

document.getElementById('nameInput').addEventListener('paste', function(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (text.includes('\n') || text.includes(',') || text.includes('\t')) {
    e.preventDefault();
    document.getElementById('pasteArea').value = text;
    importPasted();
  }
});

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// Init
renderList();
drawWheel(0);
