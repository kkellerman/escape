const STATUS_COLORS = { Good: '#28a745', Fair: '#f0ad4e', Poor: '#d9534f', Dead: '#222' };

const DEST_NAMES = { '1': 'North Idaho', '2': 'Missoula, Montana', '3': 'Wyoming' };

// ─── Progress / Journey ───────────────────────────────────────────────────────

export function renderProgressBar(value) {
  document.getElementById('progressbar-fill').style.width = `${Math.min(Math.max(value, 0), 100)}%`;
}

// ─── Health bars ──────────────────────────────────────────────────────────────

export function renderHealthBars(allChars) {
  const ids = ['char1', 'char2', 'char3', 'char4', 'char5'];
  allChars.forEach((char, i) => {
    const fill = document.querySelector(`#${ids[i]}-health-bar .health-fill`);
    if (fill) {
      fill.style.width = `${Math.max(0, char.health)}%`;
      fill.style.backgroundColor = STATUS_COLORS[char.status] || '#28a745';
    }
  });
}

// ─── Player status panel ──────────────────────────────────────────────────────

export function renderPlayerStatus(allChars, vehicle) {
  const slots = ['one', 'two', 'three', 'four', 'five'];
  allChars.forEach((char, i) => {
    const nameEl = document.getElementById(`player-${slots[i]}-name`);
    const isDead = char.status === 'Dead';
    nameEl.textContent = (isDead ? '💀 ' : '') + char.name;
    document.getElementById(`player-${slots[i]}-status`).textContent = char.status;
    const illnessEl = document.getElementById(`player-${slots[i]}-illness`);
    illnessEl.textContent = char.illness.length > 0
      ? '🤒 ' + char.illness.length
      : '0';
    const member = nameEl.closest('.crew-member');
    if (member) member.classList.toggle('crew-dead', isDead);
  });
  document.getElementById('vehicle-food-remaining').textContent = vehicle.food.toFixed(0);
  document.querySelectorAll('.vehicle-money-remaining').forEach(el => { el.textContent = vehicle.money.toFixed(2); });
  document.getElementById('vehicle-bullets-remaining').textContent = vehicle.bullets.toFixed(0);
  document.getElementById('vehicle-tires-remaining').textContent = vehicle.tires;
  document.getElementById('vehicle-meds-remaining').textContent = vehicle.meds;
  document.querySelectorAll('.current-date').forEach(el => { el.textContent = vehicle.days; });
  document.querySelectorAll('.distance-traveled').forEach(el => { el.textContent = vehicle.distance; });
  const turnEl = document.getElementById('turn-count');
  if (turnEl) turnEl.textContent = vehicle.turns;
}

// ─── Event log ────────────────────────────────────────────────────────────────

export function prependEvent(message, tone = '') {
  const container = document.querySelector('#ongoing-text-box .ongoing-events');
  const span = document.createElement('span');
  if (tone) span.className = `event-${tone}`;
  const br = document.createElement('br');
  container.insertBefore(br, container.firstChild);
  container.insertBefore(span, container.firstChild);

  let i = 0;
  const interval = setInterval(() => {
    span.textContent += message[i];
    i++;
    if (i >= message.length) clearInterval(interval);
  }, 18);
}

// ─── Screen transitions ───────────────────────────────────────────────────────

function fadeOut(el, duration = 500) {
  el.style.transition = `opacity ${duration}ms`;
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.display = 'none';
    el.style.opacity = '';
    el.style.transition = '';
  }, duration);
}

function fadeIn(el, delay = 0, duration = 500) {
  setTimeout(() => {
    el.style.display = 'block';
    el.style.opacity = '0';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${duration}ms`;
        el.style.opacity = '1';
        setTimeout(() => { el.style.transition = ''; }, duration);
      });
    });
  }, delay);
}

export function showScreen(id, delay = 0) {
  fadeIn(document.getElementById(id), delay);
}

export function hideScreen(id) {
  fadeOut(document.getElementById(id));
}

// ─── Modals ───────────────────────────────────────────────────────────────────

export function showInfoModal(imagePath) {
  const src = imagePath.includes('.') ? `img/${imagePath}` : `img/${imagePath}.jpg`;
  document.querySelector('#myModal .modal-child').innerHTML =
    `<img src="${src}" alt=""><div id="popup-text" class="ongoing-events"></div>`;
  document.getElementById('myModal').style.display = 'block';
}

export function showTextModal(message) {
  document.querySelector('#myModal .modal-child').innerHTML =
    `<div id="popup-text" class="ongoing-events" style="padding:30px;font-size:18px;">${message}</div>`;
  document.getElementById('myModal').style.display = 'block';
}

export function showInfoModalWithMessage(imagePath, message) {
  showInfoModal(imagePath);
  document.querySelector('#myModal #popup-text').insertAdjacentHTML('afterbegin', message + ' <br>');
}

export function hideInfoModal() {
  document.getElementById('myModal').style.display = 'none';
}

export function showGameOverModal() {
  document.querySelector('#myModal .modal-child').innerHTML =
    `<img src="img/events/dead.jpg" alt="">
    <div id="popup-text" class="button-content">
      <div class="buttons">
        <span id="deathButton" class="btn btn-danger">Try Again</span>
      </div>
    </div>`;
  document.querySelector('#myModal .button-content').insertAdjacentHTML('afterbegin', "Game Over. Your party didn't make it. California claimed another one.");
  document.getElementById('myModal').style.display = 'block';
}

function saveHighScore(score, destination) {
  const destName = DEST_NAMES[destination] || 'Freedom';
  const scores = JSON.parse(localStorage.getItem('escapeHighScores') || '[]');
  scores.push({ score: parseInt(score), dest: destName, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => b.score - a.score);
  scores.splice(5);
  localStorage.setItem('escapeHighScores', JSON.stringify(scores));
  return scores;
}

function buildHighScoreTable(scores) {
  if (!scores.length) return '<p>No scores yet.</p>';
  return `<table style="width:100%;font-size:13px;margin-top:8px">
    <tr><th>#</th><th>Score</th><th>Destination</th><th>Date</th></tr>
    ${scores.map((s, i) => `<tr><td>${i + 1}</td><td>${s.score}</td><td>${s.dest}</td><td>${s.date}</td></tr>`).join('')}
  </table>`;
}

export function showWinModal(score, destination) {
  const destName = DEST_NAMES[destination] || 'Freedom';
  const scores = saveHighScore(score, destination);
  document.querySelector('#buttonModal .modal-child').innerHTML =
    `<img src="img/events/500.jpg" alt="">
    <div id="popup-text" class="button-content">
      <div class="buttons">
        <span id="winButton" class="btn btn-success">Play Again</span>
      </div>
    </div>`;
  document.querySelector('#buttonModal .button-content').insertAdjacentHTML('afterbegin',
    `<h4>YOU ESCAPED TO ${destName.toUpperCase()}!</h4>
     <p>Escape score: <strong>${score}</strong></p>
     <h5>Top Scores</h5>${buildHighScoreTable(scores)}`
  );
  document.getElementById('buttonModal').classList.add('confetti');
  document.getElementById('buttonModal').style.display = 'block';
}

function resolveImageSrc(imagePath) {
  return imagePath.includes('.') ? `img/${imagePath}` : `img/${imagePath}.jpg`;
}

export function showChoiceModal(imageSrc, btn1Id, btn2Id, btn1Label, btn2Label, message, btn3 = null) {
  const btn3Html = btn3
    ? `<span id="${btn3.id}Button" class="btn btn-danger">${btn3.label}</span>`
    : '';
  const src = resolveImageSrc(imageSrc);
  document.querySelector('#buttonModal .modal-child').innerHTML =
    `<img src="${src}" alt="">
    <div id="popup-text" class="button-content">
      <div class="buttons">
        <span id="${btn1Id}Button" class="btn btn-success">${btn1Label}</span>
        <span id="${btn2Id}Button" class="btn btn-warning">${btn2Label}</span>
        ${btn3Html}
      </div>
    </div>`;
  document.querySelector('#buttonModal .button-content').insertAdjacentHTML('afterbegin', message + ' <br>');
  document.getElementById('buttonModal').style.display = 'block';
}

export function hideButtonModal() {
  document.getElementById('buttonModal').style.display = 'none';
}

// ─── Audio ────────────────────────────────────────────────────────────────────

export function playSound(id) {
  const el = document.getElementById(id);
  if (el) el.play().catch(() => {});
}

// ─── Wheel-break animation ────────────────────────────────────────────────────

const pause = ms => new Promise(r => setTimeout(r, ms));

export async function triggerWheelAnimation() {
  const wheelEl = document.getElementById('wheel-anim');
  const show = el => { el.style.display = 'block'; };
  const hide = el => { el.style.display = 'none'; };

  wheelEl.classList.add('rolling');
  show(wheelEl);
  await pause(750);
  hide(wheelEl);
  wheelEl.classList.remove('rolling');
  await pause(400); show(document.getElementById('jesus'));
  await pause(5000); hide(document.getElementById('jesus'));
  show(document.getElementById('star'));
  await pause(500); hide(document.getElementById('star'));
}

// ─── Vehicle image cycling ────────────────────────────────────────────────────

// Thresholds are % of total journey (0–100)
// Left positions for each of the 6 vehicle steps (right → left)
const JEEP_POSITIONS = { 1: '78%', 2: '62%', 3: '46%', 4: '30%', 5: '14%', 6: '1%' };

const SKY_PHASES = [
  { maxPct: 14,  cls: 'sky-cali'     },
  { maxPct: 24,  cls: 'sky-desert'   },
  { maxPct: 40,  cls: 'sky-plateau'  },
  { maxPct: 56,  cls: 'sky-mountain' },
  { maxPct: 72,  cls: 'sky-golden'   },
  { maxPct: 84,  cls: 'sky-dusk'     },
  { maxPct: 96,  cls: 'sky-night'    },
  { maxPct: 100, cls: 'sky-dawn'     },
];

const DEST_SKY = { '1': 'sky-idaho', '2': 'sky-montana', '3': 'sky-wyoming' };

const ALL_SKY = [
  ...SKY_PHASES.map(p => p.cls),
  ...Object.values(DEST_SKY),
  'sky1','sky2','sky3','sky4','sky5','sky6',
];

export function cycleVehicleImage(state) {
  const x    = state.vehicleImageIndex;
  const next = x < 6 ? x + 1 : 1;
  const images = document.getElementById('vehicle-images');
  const jeep   = document.getElementById('jeep-main');

  if (next === 1) {
    // Reset: fade out, reposition, fade back in
    jeep.style.transition = 'opacity 150ms ease-out';
    jeep.style.opacity = '0';
    setTimeout(() => {
      jeep.style.transition = 'none';
      jeep.style.left = JEEP_POSITIONS[next];
      jeep.offsetHeight;
      jeep.style.transition = 'opacity 150ms ease-in';
      jeep.style.opacity = '1';
      setTimeout(() => { jeep.style.transition = ''; }, 150);
    }, 150);
  } else {
    jeep.style.left = JEEP_POSITIONS[next];
  }

  const dist = state.vehicle ? state.vehicle.distance : 0;
  const goal = state.goalDistance || 500;
  const pct  = (dist / goal) * 100;
  const phase = SKY_PHASES.find(p => pct <= p.maxPct) || SKY_PHASES[SKY_PHASES.length - 1];
  images.classList.remove(...ALL_SKY);
  images.classList.add(phase.cls);

  state.vehicleImageIndex = next;
}

// ─── Route map modal ──────────────────────────────────────────────────────────

// Route waypoints as % of image [startX, startY, endX, endY]
// Based on route.png: two CA start points, three green destination zones
const ROUTE_WAYPOINTS = {
  '1': { sx: 10, sy: 88, ex: 18, ey: 10 },  // North Idaho  (left route, top-left green)
  '2': { sx: 50, sy: 88, ex: 72, ey: 42 },  // Montana      (right route, center-right green)
  '3': { sx: 50, sy: 88, ex: 73, ey: 73 },  // Wyoming      (right route, bottom-right green)
};

export function showMapModal(destination, completedPct) {
  const modal  = document.getElementById('mapModal');
  const marker = document.getElementById('route-marker');
  const wp     = ROUTE_WAYPOINTS[destination] || ROUTE_WAYPOINTS['1'];
  const pct    = Math.min(completedPct, 100) / 100;

  const x = wp.sx + (wp.ex - wp.sx) * pct;
  const y = wp.sy + (wp.ey - wp.sy) * pct;

  marker.style.left = `${x}%`;
  marker.style.top  = `${y}%`;
  modal.style.display = 'flex';
}

export function hideMapModal() {
  document.getElementById('mapModal').style.display = 'none';
}

export function applyDestinationSky(destination) {
  const images = document.getElementById('vehicle-images');
  images.classList.remove(...ALL_SKY);
  images.classList.add(DEST_SKY[destination] || 'sky-dawn');
}

// ─── Button throttle ──────────────────────────────────────────────────────────

export function disableButton(id, tempColor) {
  const btn = document.getElementById(id);
  btn.style.pointerEvents = 'none';
  btn.style.backgroundColor = tempColor;
  btn.style.borderColor = tempColor;
}

export function enableButton(id, color) {
  const btn = document.getElementById(id);
  btn.style.pointerEvents = 'auto';
  btn.style.backgroundColor = color;
  btn.style.borderColor = color;
}

// ─── Shake validation ─────────────────────────────────────────────────────────

export function shakeElement(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}
