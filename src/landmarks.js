import { getState } from './state.js';

// Returns a landmark descriptor object, or null if no landmark at current distance
export function landmarkEvent() {
  const { vehicle, goalDistance } = getState();
  const dist = vehicle.distance;
  const mark = p => Math.round(goalDistance * p / 10) * 10;

  if (dist === mark(0.2)) {
    return {
      type: 'river',
      image: 'events/100',
      btn1: { id: 'crossRiver', label: 'Bluff It' },
      btn2: { id: 'detourRiver', label: 'Detour' },
      message: "CARB enforcement units are scanning vehicles on the Grapevine. You can attempt to bluff through the checkpoint or take a back-road detour through the mountains (7 days)."
    };
  } else if (dist === mark(0.4)) {
    return {
      type: 'store',
      image: 'events/campStore',
      message: 'Your convoy stumbles on an abandoned REI distribution center. Grab what you need.'
    };
  } else if (dist === mark(0.6)) {
    return {
      type: 'cannibal',
      image: 'events/300',
      btn1: { id: 'sacrifice', label: 'Leave One' },
      btn2: { id: 'flee', label: 'Run It' },
      message: "A Sinaloa convoy blocks the road. Their leader steps forward: 'Leave one of yours and the rest drive on. Your call.'"
    };
  } else if (dist === mark(0.8)) {
    return {
      type: 'store',
      image: 'events/generalStore',
      message: 'A border town trading post — last resupply before free territory. Stock up.'
    };
  } else if (dist === mark(1.0)) {
    return { type: 'win' };
  }
  return null;
}

export function detourRiver() {
  const { vehicle } = getState();
  for (let i = 0; i < 8; i++) {
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
  }
  vehicle.statusAdjuster();
  return { message: 'You took the back roads through the mountains. Seven hard days but no checkpoint.' };
}

export function crossRiver() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 100);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num > 50) {
    const foodLost = (vehicle.food * 0.4).toFixed(0);
    const moneyLost = (vehicle.money * 0.2).toFixed(0);
    char.health -= 30;
    vehicle.food -= vehicle.food * 0.4;
    vehicle.money -= vehicle.money * 0.2;
    for (let i = 0; i < 4; i++) {
      vehicle.statusAdjuster();
      vehicle.days += 1;
      vehicle.food -= vehicle.characters.length * 5;
    }
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return {
      message: `${char.name} was flagged. The agents beat the convoy and seized ${foodLost} lbs of rations and ₿${moneyLost}.`,
      modalImage: 'events/riverFail'
    };
  } else {
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return { message: "You talked your way through. The agent didn't check the back.", modalImage: 'events/riverWin' };
  }
}

export function sacrifice() {
  const { vehicle } = getState();
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];
  char.health = 0;
  vehicle.statusAdjuster();
  return { message: `${char.name} was left behind. The caravan drives on. Nobody looks back.` };
}

export function payAntifa(tax) {
  const { vehicle } = getState();
  vehicle.money = Math.max(0, vehicle.money - tax);
  return {
    message: `You hand over ₿${tax}. They let the convoy pass. Extortion dressed as solidarity.`,
  };
}

export function fightBackAntifa() {
  const { vehicle } = getState();

  if (vehicle.bullets < 2) {
    return { message: "You reach for your weapon — not enough rounds. You're forced to push through empty-handed.", modalImage: 'fleeFail' };
  }

  vehicle.bullets -= 2;
  const num = Math.floor(Math.random() * 100);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num >= 70) {
    const recovered = Math.floor(Math.random() * 50) + 20;
    vehicle.food += recovered;
    vehicle.statusAdjuster();
    return { message: `You opened fire. The bloc scattered instantly. You recovered ${recovered} lbs of rations from their supply cache as you rolled through. 2 rounds expended.` };
  } else if (num >= 20) {
    char.health -= 15;
    vehicle.days += 1;
    vehicle.food -= vehicle.dailyFoodCost();
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return { message: `Firefight broke out. ${char.name} took a hit before the bloc retreated. Convoy pushed through. 2 rounds expended.`, modalImage: 'fleeFail' };
  } else {
    char.health -= 35;
    vehicle.bullets -= 1;
    vehicle.days += 2;
    vehicle.food -= vehicle.dailyFoodCost() * 2;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return { message: `The bloc was armed. ${char.name} was seriously wounded in the exchange. You fought your way out but it cost you. 3 rounds expended.`, modalImage: 'fleeFail' };
  }
}

export function fightAntifa() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 100);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num > 45) {
    const foodLost = Math.floor(vehicle.food * 0.15);
    char.health -= 20;
    vehicle.food -= foodLost;
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return {
      message: `You pushed through but they fought back. ${char.name} took hits and you lost ${foodLost} lbs of rations pulled from the truck bed before you broke free.`,
      modalImage: 'events/fleeFail'
    };
  } else {
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return {
      message: `You gunned it through the barricade. They scattered. Convoy clear — no losses.`,
    };
  }
}

export function flee() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 100);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num > 50) {
    char.health = 0;
    vehicle.statusAdjuster();
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return {
      message: `They caught ${char.name} before you cleared the roadblock. We can only guess what happened next.`,
      modalImage: 'events/fleeFail'
    };
  } else {
    vehicle.days += 1;
    vehicle.food -= vehicle.characters.length * 5;
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return { message: 'You floored it. Nobody could match your speed. The convoy escaped clean.' };
  }
}
