import { positiveEvent, neutralEvent, negativeEvent, deathEvent, antifaEvent } from './events.js';
import { landmarkEvent } from './landmarks.js';
import { getState } from './state.js';

export class Vehicle {
  constructor() {
    this.food = 0;
    this.money = 500;
    this.days = 0;
    this.characters = [];
    this.bullets = 0;
    this.tires = 1;
    this.meds = 0;
    this.distance = 0;
    this.hunted = 0;
    this.turns = 0;
    this.completed = 0.01;
  }

  dailyFoodCost() {
    return this.characters.reduce((sum, c) => sum + (c.isPet ? 5 / 8 : 5), 0);
  }

  resourceChecker() {
    if (this.food <= 0) {
      this.food = 0;
      this.characters.forEach(char => { char.health -= 10; });
    }
    if (this.bullets <= 0) {
      this.bullets = 0;
    }
  }

  // Updates health/status for all characters, removes dead ones.
  // Returns 'gameover' if all characters are dead.
  statusAdjuster() {
    const dead = [];
    this.characters.forEach(char => {
      if (char.illness.length === 1) char.health -= 2;
      else if (char.illness.length === 2) char.health -= 4;
      else if (char.illness.length >= 3) char.health -= 6;

      if (char.health >= 80) char.status = 'Good';
      else if (char.health >= 20) char.status = 'Fair';
      else if (char.health > 0) char.status = 'Poor';
      else char.status = 'Dead';

      if (char.health <= 0) dead.push(char);
    });

    dead.forEach(char => {
      this.characters.splice(this.characters.indexOf(char), 1);
      char.status = 'Dead';
    });

    return this.characters.length === 0 ? 'gameover' : null;
  }

  // Returns a result object from the triggered event, or null
  eventGrabber() {
    const { goalDistance } = getState();
    const landmarks = [0.2, 0.4, 0.6, 0.8, 1.0].map(p => Math.round(goalDistance * p / 10) * 10);
    if (landmarks.includes(this.distance)) return null;
    const num = Math.floor(Math.random() * 100);
    const tag = (r, tone) => r ? { ...r, tone } : null;
    if (num >= 80) return tag(positiveEvent(), 'positive');
    if (num >= 60) return tag(neutralEvent(), 'neutral');
    if (num >= 40) return tag(negativeEvent(), 'negative');
    if (num >= 35) return tag(deathEvent(), 'death');
    if (num >= 28) return antifaEvent();
    return null;
  }

  // Main game loop. Returns array of result objects for the handler to render.
  turn() {
    this.hunted = 0;
    const results = [];

    const eventResult = this.eventGrabber();
    if (eventResult) results.push({ type: 'event', ...eventResult });

    const illnessMessages = [];
    this.characters.forEach(char => {
      const msg = char.illnessGenerator();
      if (msg) illnessMessages.push(msg);
    });
    if (illnessMessages.length) results.push({ type: 'illness', messages: illnessMessages });

    const gameOver = this.statusAdjuster();
    if (gameOver) {
      results.push({ type: 'gameover' });
      return results;
    }

    this.food = this.food > 0 ? this.food - this.dailyFoodCost() : 0;
    this.days += 1;
    this.distance += 30;
    this.turns += 1;
    this.completed = parseFloat(((this.distance / getState().goalDistance) * 100).toFixed(2));
    this.resourceChecker();

    const landmark = landmarkEvent();
    if (landmark) results.push({ type: 'landmark', landmark });

    return results;
  }

  rest() {
    const hasMeds = this.meds > 0;
    if (hasMeds) this.meds -= 1;
    this.characters.forEach(char => {
      // Meds: remove 2 illnesses and heal +10, otherwise remove 1 and heal +2
      const illnessesToRemove = hasMeds ? 2 : 1;
      char.illness.splice(0, illnessesToRemove);
      char.health = Math.min(99, char.health + (hasMeds ? 10 : 2));
    });
    this.statusAdjuster();
    this.food -= this.dailyFoodCost();
    this.days += 1;
    this.resourceChecker();
  }

  useMedKit() {
    if (this.meds <= 0) return { success: false };
    this.meds -= 1;
    this.characters.forEach(char => {
      char.illness.splice(0, 1);
      char.health = Math.min(99, char.health + 20);
    });
    this.statusAdjuster();
    return { success: true };
  }

  // Returns array of result objects
  huntingTime() {
    if (this.hunted === 1) {
      return [{ type: 'alreadyHunted', message: "You've already scavenged today. Drive further before stopping again.", modalImage: 'scavenge.png', sound: 'shotgun-dry' }];
    }

    if (this.bullets <= 0) {
      this.bullets = 0;
      return [];
    }

    const hunt = Math.floor(Math.random() * 150);
    this.food += hunt;
    this.bullets -= 1;
    this.statusAdjuster();
    this.hunted = 1;

    if (hunt === 0) {
      return [{ type: 'huntFail', message: 'You came back empty-handed. The convoy is not impressed.', modalImage: 'huntFail' }];
    }

    return [{ type: 'huntSuccess', message: `You scavenged ${hunt} lbs of rations.`, sound: 'shotgun-fire' }];
  }

  // Class selection: sets starting crypto bonus (food stays from kit)
  profession(input) {
    const classes = {
      1: { money: 800 },              // Professional
      2: { money: 400, food: 100 },   // Software Developer
      3: { money: 50 }                // Wage Slave
    };
    const bonus = classes[input];
    if (bonus) {
      if (bonus.money) this.money += bonus.money;
      if (bonus.food) this.food += bonus.food;
    }
  }

  // Kit selection: sets starting rations + ammo
  kit(input) {
    const kits = {
      1: { food: 400, bullets: 60 },  // Survivalist
      2: { food: 150, bullets: 20 },  // Tech
      3: { food: 50,  bullets: 5 }    // Budget
    };
    const gear = kits[input];
    if (gear) {
      this.food += gear.food;
      this.bullets += gear.bullets;
    }
  }

  buildScore() {
    let score = 10000;
    score -= ((this.days - 50) * 20) + ((5 - this.characters.length) * 2000) - (this.food * 0.2) - (this.money * 0.3) - (this.bullets * 0.1);
    return score.toFixed();
  }
}
