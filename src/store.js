import { getState } from './state.js';

// Pure calculation — returns cost breakdown
export function storeSubTotal(food, bullets, tires, meds) {
  const foodCost   = food   * 0.20;
  const bulletCost = bullets * 0.10;
  const tireCost   = tires  * 5.00;
  const medCost    = meds   * 15.00;
  return {
    foodCost:   foodCost.toFixed(2),
    bulletCost: bulletCost.toFixed(2),
    tireCost:   tireCost.toFixed(2),
    medCost:    medCost.toFixed(2),
    total:      (foodCost + bulletCost + tireCost + medCost).toFixed(2)
  };
}

// Mutates vehicle state. Returns { success: bool }
export function storeBuy(food, bullets, tires, meds) {
  const { vehicle } = getState();
  const total = parseFloat(((food * 0.20) + (bullets * 0.10) + (tires * 5.00) + (meds * 15.00)).toFixed(2));

  if (isNaN(total) || vehicle.money < total || food < 0 || bullets < 0 || tires < 0 || meds < 0) {
    return { success: false };
  }

  vehicle.money   -= total;
  vehicle.food    += food;
  vehicle.bullets += bullets;
  vehicle.tires   += tires;
  vehicle.meds    += meds;
  return { success: true };
}
