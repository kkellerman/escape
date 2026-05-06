const DEST_DISTANCES = { '1': 1200, '2': 1200, '3': 960 };

const state = {
  vehicle: null,
  allChars: [],
  vehicleImageIndex: 1,
  destination: null,
  goalDistance: 500
};

export { DEST_DISTANCES };

export function getState() {
  return state;
}

export function setState(patch) {
  return Object.assign(state, patch);
}
