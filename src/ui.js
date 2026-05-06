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
    nameEl.textContent = char.name;
    document.getElementById(`player-${slots[i]}-status`).textContent = char.status;
    document.getElementById(`player-${slots[i]}-illness`).textContent = char.illness.length;
    const member = nameEl.closest('.crew-member');
    if (member) member.classList.toggle('crew-dead', char.status === 'Dead');
  });
  document.getElementById('vehicle-food-remaining').textContent = vehicle.food.toFixed(0);
  document.querySelectorAll('.vehicle-money-remaining').forEach(el => { el.textContent = vehicle.money.toFixed(2); });
  document.getElementById('vehicle-bullets-remaining').textContent = vehicle.bullets.toFixed(0);
  document.getElementById('vehicle-tires-remaining').textContent = vehicle.tires;
  document.getElementById('vehicle-meds-remaining').textContent = vehicle.meds;
  document.querySelectorAll('.current-date').forEach(el => { el.textContent = vehicle.days; });
  document.querySelectorAll('.distance-traveled').forEach(el => { el.textContent = vehicle.distance; });
}

// ─── Event log ────────────────────────────────────────────────────────────────

export function prependEvent(message, tone = '') {
  const cls = tone ? ` class="event-${tone}"` : '';
  document.querySelector('#ongoing-text-box .ongoing-events').insertAdjacentHTML('afterbegin', `<span${cls}>${message}</span><br>`);
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
  document.querySelector('#myModal .modal-child').innerHTML =
    `<img src="img/${imagePath}.jpg" alt=""><div id="popup-text" class="ongoing-events"></div>`;
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
    `<img src="img/dead.jpg" alt="">
    <div id="popup-text" class="button-content">
      <div class="buttons">
        <span id="deathButton" class="btn btn-danger">Try Again</span>
      </div>
    </div>`;
  document.querySelector('#myModal .button-content').insertAdjacentHTML('afterbegin', "Game Over. Your party didn't make it. California claimed another one.");
  document.getElementById('myModal').style.display = 'block';
}

export function showWinModal(score, destination) {
  const destName = DEST_NAMES[destination] || 'Freedom';
  document.querySelector('#buttonModal .modal-child').innerHTML =
    `<img src="img/500.jpg" alt="">
    <div id="popup-text" class="button-content">
      <div class="buttons">
        <span id="winButton" class="btn btn-success">Play Again</span>
      </div>
    </div>`;
  document.querySelector('#buttonModal .button-content').insertAdjacentHTML('afterbegin',
    `<h4>YOU ESCAPED TO ${destName.toUpperCase()}!</h4>Escape score: ${score}`
  );
  document.getElementById('buttonModal').classList.add('confetti');
  document.getElementById('buttonModal').style.display = 'block';
}

export function showChoiceModal(imageSrc, btn1Id, btn2Id, btn1Label, btn2Label, message, btn3 = null) {
  const btn3Html = btn3
    ? `<span id="${btn3.id}Button" class="btn btn-danger">${btn3.label}</span>`
    : '';
  document.querySelector('#buttonModal .modal-child').innerHTML =
    `<img src="img/${imageSrc}.jpg" alt="">
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

  show(wheelEl);
  await pause(750);
  hide(wheelEl);
  await pause(400); show(document.getElementById('jesus'));
  await pause(5000); hide(document.getElementById('jesus'));
  show('star');
  await pause(500); hide('star');
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

export function cycleWagonImage(state) {
  const x    = state.vehicleImageIndex;
  const next = x < 6 ? x + 1 : 1;
  const images = document.getElementById('vehicle-images');
  const jeep   = document.getElementById('jeep-main');

  jeep.style.left = JEEP_POSITIONS[next];

  const dist = state.vehicle ? state.vehicle.distance : 0;
  const goal = state.goalDistance || 500;
  const pct  = (dist / goal) * 100;
  const phase = SKY_PHASES.find(p => pct <= p.maxPct) || SKY_PHASES[SKY_PHASES.length - 1];
  images.classList.remove(...ALL_SKY);
  images.classList.add(phase.cls);

  state.vehicleImageIndex = next;
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
