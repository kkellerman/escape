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

const MAX_FOOD = 2000;
const MAX_MEDS = 4;

// Mutates vehicle state. Returns { success: bool, reason?: string }
export function storeBuy(food, bullets, tires, meds) {
  const { vehicle } = getState();
  const total = parseFloat(((food * 0.20) + (bullets * 0.10) + (tires * 5.00) + (meds * 15.00)).toFixed(2));

  if (isNaN(total) || food < 0 || bullets < 0 || tires < 0 || meds < 0) {
    return { success: false };
  }
  if (vehicle.food + food > MAX_FOOD) {
    const canBuy = MAX_FOOD - vehicle.food;
    return { success: false, reason: `You currently have ${vehicle.food.toFixed(0)} lbs of rations. Your convoy can only stow ${MAX_FOOD} lbs total — you can buy ${canBuy > 0 ? canBuy + ' more lbs' : 'no more'}.` };
  }
  if (vehicle.meds + meds > MAX_MEDS) {
    return { success: false, reason: `Med kit capacity is full. Your convoy can carry a maximum of ${MAX_MEDS} med kits at one time.` };
  }
  if (vehicle.money < total) {
    return { success: false, reason: 'Not enough crypto to cover this purchase.' };
  }

  vehicle.money   -= total;
  vehicle.food    += food;
  vehicle.bullets += bullets;
  vehicle.tires   += tires;
  vehicle.meds    += meds;
  return { success: true };
}
