import { initHandlers } from './handlers.js';
import { getState } from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  initHandlers();
  if (import.meta.env.DEV) {
    window.gameState = getState;
    const panel = document.createElement('pre');
    panel.id = 'debug-panel';
    panel.style.cssText = [
      'position:fixed',
      'right:10px',
      'bottom:10px',
      'z-index:9999',
      'max-width:360px',
      'max-height:45vh',
      'overflow:auto',
      'margin:0',
      'padding:10px',
      'background:rgba(0,0,0,0.55)',
      'color:#9ef59e',
      'font:12px/1.4 monospace',
      'border:1px solid #3b7a3b',
      'border-radius:6px',
      'box-shadow:0 4px 12px rgba(0,0,0,0.35)',
      'pointer-events:auto'
    ].join(';');
    document.body.appendChild(panel);

    const renderDebugPanel = () => {
      const state = getState();
      const vehicle = state.vehicle;
      const chars = (state.allChars || []).map(c => ({
        name: c.name,
        pet: !!c.isPet,
        health: c.health,
        status: c.status,
        illness: c.illness
      }));
      const snapshot = {
        destination: state.destination,
        goalDistance: state.goalDistance,
        vehicle: vehicle ? {
          food: vehicle.food,
          bullets: vehicle.bullets,
          money: vehicle.money,
          tires: vehicle.tires,
          meds: vehicle.meds,
          days: vehicle.days,
          distance: vehicle.distance,
          completed: vehicle.completed,
          huntedToday: vehicle.hunted
        } : null,
        characters: chars
      };
      panel.textContent = `DEV STATE\n${JSON.stringify(snapshot, null, 2)}`;
    };

    renderDebugPanel();
    window.debugStateInterval = setInterval(renderDebugPanel, 250);
  }
});
