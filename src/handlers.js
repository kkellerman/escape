import { getState, setState, DEST_DISTANCES } from './state.js';
import { Character } from './Character.js';
import { Vehicle } from './Vehicle.js';
import { storeBuy, storeSubTotal } from './store.js';
import { crossRiver, detourRiver, sacrifice, flee, payAntifa, fightAntifa, fightBackAntifa } from './landmarks.js';
import * as ui from './ui.js';
// showMapModal and hideMapModal are accessed via ui.*

export function initHandlers() {
  // Initialize vehicle image sky class
  document.getElementById('vehicle-images').classList.add('sky1');

  // Close #myModal when clicking anywhere on it
  document.getElementById('myModal').addEventListener('click', () => ui.hideInfoModal());

  // Start screen → class/party selection
  document.getElementById('startBTN').addEventListener('click', () => {
    // ui.playSound('openingSong');
    ui.hideScreen('start');
    ui.showScreen('characterInput', 500);
  });

  // Class + party naming → destination selection
  document.getElementById('characterBTN').addEventListener('click', onCharacterSubmit);

  // Destination selection → kit selection
  document.getElementById('destinationBTN').addEventListener('click', onDestinationSelect);

  // Kit selection → vehicle selection
  document.getElementById('kitBTN').addEventListener('click', onKitSelect);

  // Vehicle selection → supply run store
  document.getElementById('vehicleBTN').addEventListener('click', () => {
    ui.hideScreen('vehicleSelect');
    ui.showScreen('store', 500);
  });

  // Store sub-total preview
  document.getElementById('subtotal').addEventListener('click', () => {
    const food    = parseInt(document.querySelector('#food-fields input').value)    || 0;
    const bullets = parseInt(document.querySelector('#bullet-fields input').value)  || 0;
    const tires   = parseInt(document.querySelector('#tire-fields input').value)    || 0;
    const meds    = parseInt(document.querySelector('#med-fields input').value)     || 0;
    const totals  = storeSubTotal(food, bullets, tires, meds);
    document.querySelector('.food-total').textContent   = totals.foodCost;
    document.querySelector('.bullet-total').textContent = totals.bulletCost;
    document.querySelector('.tire-total').textContent   = totals.tireCost;
    document.querySelector('.med-total').textContent    = totals.medCost;
    document.querySelector('.store-total').textContent  = `₿ ${totals.total}`;
  });

  // Store buy
  document.getElementById('storeBTN').addEventListener('click', onStoreBuy);

  // Back from initial supply store to kit selection
  document.getElementById('back-button').addEventListener('click', () => {
    ui.hideScreen('store');
    ui.showScreen('kitSelect', 500);
  });

  // Main game actions
  document.getElementById('continue-button').addEventListener('click', onContinue);
  document.getElementById('rest-button').addEventListener('click', onRest);
  document.getElementById('hunt-button').addEventListener('click', onHunt);
  document.getElementById('medkit-button').addEventListener('click', onMedKit);

  // Destination map preview
  const DEST_IMAGES = { '1': 'panhandle.png', '2': 'montana.png', '3': 'wyoming.png' };
  document.querySelectorAll('input[name="destination"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('dest-map').src = `img/${DEST_IMAGES[radio.value]}`;
    });
  });

  // Map button — show route progress
  document.getElementById('map-button').addEventListener('click', () => {
    const { vehicle, destination } = getState();
    ui.showMapModal(destination, vehicle ? vehicle.completed : 0);
  });
  document.getElementById('mapModal').addEventListener('click', () => ui.hideMapModal());

  // Skull button — restart
  document.getElementById('sacrifice').addEventListener('click', () => location.reload());

  // Delegated clicks for dynamically-created modal buttons
  document.addEventListener('click', onDocumentClick);
}

// ─── Class + party setup ──────────────────────────────────────────────────────

function onCharacterSubmit() {
  const names = [
    document.getElementById('char1').value,
    document.getElementById('char2').value,
    document.getElementById('char3').value,
    document.getElementById('char4').value,
    document.getElementById('char5').value
  ];
  const classChoice = document.querySelector('input[name="profession"]:checked')?.value;

  if (!classChoice || names.some(n => n === '')) {
    ui.shakeElement('#charNameInput');
    ui.shakeElement('#profession');
    return;
  }

  const isPet = document.querySelector('input[name="char5type"]:checked')?.value === 'pet';
  const allChars = names.map((n, i) => new Character(n, i === 4 && isPet));
  const vehicle = new Vehicle();
  setState({ vehicle, allChars });
  vehicle.characters.push(...allChars);
  vehicle.profession(parseInt(classChoice));

  ui.hideScreen('characterInput');
  ui.showScreen('destinationSelect', 500);
}

// ─── Destination selection ────────────────────────────────────────────────────

function onDestinationSelect() {
  const dest = document.querySelector('input[name="destination"]:checked')?.value;
  if (!dest) {
    ui.shakeElement('#destinationSelect .prettyColumn');
    return;
  }
  setState({ destination: dest, goalDistance: DEST_DISTANCES[dest] || 500 });
  document.getElementById('kit-map').src = document.getElementById('dest-map').src;
  ui.hideScreen('destinationSelect');
  ui.showScreen('kitSelect', 500);
}

// ─── Kit selection ────────────────────────────────────────────────────────────

function onKitSelect() {
  const kitChoice = document.querySelector('input[name="kit"]:checked')?.value;
  if (!kitChoice) {
    ui.shakeElement('#kitSelect .prettyColumn');
    return;
  }

  const { vehicle, allChars } = getState();
  vehicle.kit(parseInt(kitChoice));

  ui.renderProgressBar(0);
  ui.renderHealthBars(allChars);
  ui.renderPlayerStatus(allChars, vehicle);

  ui.hideScreen('kitSelect');
  ui.showScreen('vehicleSelect', 500);
}

// ─── Supply store ─────────────────────────────────────────────────────────────

function onStoreBuy() {
  const food    = parseInt(document.querySelector('#food-fields input').value)   || 0;
  const bullets = parseInt(document.querySelector('#bullet-fields input').value) || 0;
  const tires   = parseInt(document.querySelector('#tire-fields input').value)   || 0;
  const meds    = parseInt(document.querySelector('#med-fields input').value)    || 0;
  const result  = storeBuy(food, bullets, tires, meds);
  const { vehicle, allChars } = getState();

  if (!result.success) {
    ui.shakeElement('#store');
    return;
  }

  ui.renderPlayerStatus(allChars, vehicle);
  document.querySelector('#food-fields input').value   = 0;
  document.querySelector('#bullet-fields input').value = 0;
  document.querySelector('#tire-fields input').value   = 0;
  document.querySelector('#med-fields input').value    = 0;
  document.querySelectorAll('.store-total, .bullet-total, .food-total, .tire-total, .med-total').forEach(el => { el.textContent = '₿0'; });

  document.getElementById('openingSong').pause();

  ui.hideScreen('store');
  ui.showScreen('gameMainScreen', 500);
}

// ─── Game actions ─────────────────────────────────────────────────────────────

function onContinue() {
  ui.disableButton('continue-button', '#4a7c59');
  setTimeout(() => ui.enableButton('continue-button', '#28a745'), 500);

  const { vehicle, allChars } = getState();
  const results = vehicle.turn();
  vehicle.statusAdjuster();

  ui.renderPlayerStatus(allChars, vehicle);
  ui.renderHealthBars(allChars);
  ui.renderProgressBar(vehicle.completed);
  ui.cycleVehicleImage(getState());

  results.forEach(result => handleResult(result, vehicle, allChars));
}

function onRest() {
  ui.disableButton('rest-button', '#2a6e7c');
  setTimeout(() => ui.enableButton('rest-button', '#17a2b8'), 500);

  const { vehicle, allChars } = getState();
  vehicle.rest();
  ui.renderPlayerStatus(allChars, vehicle);
  ui.renderHealthBars(allChars);
}

function onMedKit() {
  const { vehicle, allChars } = getState();
  const result = vehicle.useMedKit();
  if (!result.success) {
    ui.prependEvent('No med kits remaining.', 'negative');
    return;
  }
  ui.prependEvent('Med kit used. Crew patched up and conditions treated.', 'positive');
  ui.renderPlayerStatus(allChars, vehicle);
  ui.renderHealthBars(allChars);
}

function onHunt() {
  const { vehicle, allChars } = getState();
  const results = vehicle.huntingTime();
  vehicle.resourceChecker();
  ui.renderPlayerStatus(allChars, vehicle);
  ui.renderHealthBars(allChars);
  results.forEach(r => renderHuntResult(r));
}

// ─── Result rendering ─────────────────────────────────────────────────────────

function handleResult(result, vehicle, allChars) {
  if (result.type === 'event') {
    if (result.message) ui.prependEvent(result.message, result.tone);
    if (result.sound) ui.playSound(result.sound);
    if (result.animation === 'wheelBreak') ui.triggerWheelAnimation();
    if (result.modalImage) ui.showInfoModalWithMessage(result.modalImage, result.message || '');
  } else if (result.type === 'illness') {
    result.messages.forEach(msg => ui.prependEvent(msg, 'illness'));
  } else if (result.type === 'antifa') {
    setState({ antifaTax: result.tax });
    ui.showChoiceModal(
      'fleeFail',
      result.btn1.id,
      result.btn2.id,
      result.btn1.label,
      result.btn2.label,
      result.message,
      result.btn3
    );
  } else if (result.type === 'gameover') {
    ui.showGameOverModal();
  } else if (result.type === 'landmark') {
    handleLandmark(result.landmark, vehicle);
  }
}

function handleLandmark(landmark, vehicle) {
  if (landmark.type === 'store') {
    ui.showInfoModal(landmark.image);
    ui.prependEvent(landmark.message);
    setTimeout(() => {
      ui.hideScreen('gameMainScreen');
      document.getElementById('back-button').style.display = 'none';
      ui.showScreen('store', 500);
    }, 300);
  } else if (landmark.type === 'river' || landmark.type === 'cannibal') {
    ui.showChoiceModal(
      landmark.image,
      landmark.btn1.id,
      landmark.btn2.id,
      landmark.btn1.label,
      landmark.btn2.label,
      landmark.message
    );
  } else if (landmark.type === 'win') {
    const { destination } = getState();
    ui.applyDestinationSky(destination);
    ui.showWinModal(vehicle.buildScore(), destination);
  }
}

function renderHuntResult(result) {
  if (result.type === 'huntSuccess') {
    ui.prependEvent(result.message);
    if (result.sound) ui.playSound(result.sound);
  } else if (result.type === 'huntFail' || result.type === 'alreadyHunted') {
    if (result.sound) ui.playSound(result.sound);
    if (result.modalImage) ui.showInfoModalWithMessage(result.modalImage, result.message);
    else ui.prependEvent(result.message);
  }
}

// ─── Delegated modal button clicks ───────────────────────────────────────────

function onDocumentClick(e) {
  const id = e.target.id;

  if (id === 'deathButton' || id === 'winButton') {
    location.reload();
  } else if (id === 'crossRiverButton') {
    afterLandmarkChoice(crossRiver());
  } else if (id === 'detourRiverButton') {
    afterLandmarkChoice(detourRiver());
  } else if (id === 'sacrificeButton') {
    afterLandmarkChoice(sacrifice());
  } else if (id === 'fleeButton') {
    afterLandmarkChoice(flee());
  } else if (id === 'payAntifaButton') {
    afterLandmarkChoice(payAntifa(getState().antifaTax || 0));
  } else if (id === 'fightAntifaButton') {
    afterLandmarkChoice(fightAntifa());
  } else if (id === 'fightBackButton') {
    afterLandmarkChoice(fightBackAntifa());
  }
}

function afterLandmarkChoice(result) {
  const { vehicle, allChars } = getState();
  ui.prependEvent(result.message);
  if (result.modalImage) ui.showInfoModalWithMessage(result.modalImage, result.message);
  ui.renderPlayerStatus(allChars, vehicle);
  ui.renderHealthBars(allChars);
  ui.hideButtonModal();
}
