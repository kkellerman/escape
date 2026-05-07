import { getState } from './state.js';

// Each function mutates 4x4 state and returns a result object:
// { message, modalImage?, sound?, animation? }

export function positiveEvent() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 5);
  const amount = Math.floor(Math.random() * (200 - 100) + 100);

  if (num === 1) {
    vehicle.money += amount;
    return { message: `You find an abandoned Tesla still charged. Sell it for parts. +₿${amount}` };
  } else if (num === 2) {
    vehicle.food += amount;
    return { message: `You raid a shuttered Whole Foods warehouse and find ${amount} lbs of vacuum-sealed rations.` };
  } else if (num === 3) {
    vehicle.food += amount;
    return { message: `A prepper commune trades you ${amount} lbs of rations for labor. Fair deal.` };
  } else if (num === 4) {
    vehicle.money += amount;
    return { message: `You shake down a government contractor at a checkpoint. +₿${amount}` };
  } else if (num === 5) {
    vehicle.money += amount / 2;
    vehicle.food += amount;
    return { message: `You ambush a state tax collection vehicle. +₿${amount / 2} and ${amount} lbs of confiscated rations.` };
  }
  return null;
}

export function neutralEvent() {
  const num = Math.floor(Math.random() * 5);
  const messages = {
    1: "A CHP drone scans your convoy but doesn't flag you. Keep moving.",
    2: 'You pick up a radio signal from a Free State broadcast. Morale briefly lifts.',
    3: 'You pass a tent city that stretches for miles. Nobody makes eye contact.',
    4: 'A roaming pack of LAPD enforcement bots patrols past your camp. You stay hidden.',
    5: 'Someone in your party hacks an EV charging station. Free juice for 20 minutes.'
  };
  return messages[num] ? { message: messages[num] } : null;
}

export function negativeEvent() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 5);
  const amount = Math.floor(Math.random() * (200 - 100) + 100);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num === 1) {
    char.health -= 10;
    return { message: `A wildfire jumps the highway. ${char.name} inhales smoke and is injured.` };
  } else if (num === 2 && !char.illness.includes('Infected Wound')) {
    char.illness.push('Infected Wound');
    return { message: `A carjacker ambushes the convoy. You fight them off but ${char.name} takes a wound.` };
  } else if (num === 3) {
    vehicle.food -= amount;
    vehicle.days += index;
    return { message: `A state checkpoint seizes ${amount} lbs of your rations as 'unlicensed provisions.'` };
  } else if (num === 4) {
    if (vehicle.tires > 0) {
      vehicle.tires -= 1;
      return {
        message: "Your vehicle throws a belt. Good thing you had a spare tire — back on the road in hours.",
        sound: 'jesusSnatch',
        animation: 'wheelBreak'
      };
    }
    vehicle.days += 5;
    vehicle.food -= vehicle.characters.length * 5 * 5;
    return {
      message: "Your vehicle throws a belt on the highway. No spare. Repair takes 5 days and burns through your rations.",
      sound: 'jesusSnatch',
      animation: 'wheelBreak'
    };
  } else if (num === 5) {
    vehicle.food -= amount;
    return { message: `${amount} lbs of rations spoil in the heat. ${char.name} left the cooler open.` };
  }
  return null;
}

export function deathEvent() {
  const { vehicle } = getState();
  const num = Math.floor(Math.random() * 5);
  const index = Math.floor(Math.random() * vehicle.characters.length);
  const char = vehicle.characters[index];

  if (num === 1 && char.health < 65) {
    char.health = 0;
    char.status = 'Dead';
    return {
      message: `A state drone misidentified ${char.name} as a hostile target. They were shot without warning.`,
      modalImage: 'events/1'
    };
  } else if (num === 2 && char.illness.includes('Radiation Sickness') && char.health < 65) {
    char.health = 0;
    char.status = 'Dead';
    if (vehicle.characters[0]) {
      vehicle.characters[0].health -= 15;
      vehicle.characters[0].illness.push('Fungal Spread');
    }
    return {
      message: `${char.name} contracted a mutated fungal infection from the Cali water supply. It spread to ${vehicle.characters[0] ? vehicle.characters[0].name : 'the group'}. ${char.name} is dead.`,
      modalImage: 'events/2'
    };
  } else if (num === 3 && char.health < 65) {
    char.health = 0;
    char.status = 'Dead';
    vehicle.money -= vehicle.money * 0.25;
    return {
      message: `${char.name} secretly consumed the crypto cold wallet. Hardware wallet destroyed. You lose 25% of your ₿.`,
      modalImage: 'events/3'
    };
  } else if (num === 4) {
    const lost = (vehicle.food * 0.5).toFixed(2);
    vehicle.food -= vehicle.food * 0.5;
    return {
      message: `${char.name} raided the emergency ration stash at 3am and ate everything. You lose ${lost} lbs of rations.`,
      modalImage: 'events/4'
    };
  } else if (num === 5 && char.illness[0] === 'Infected Wound') {
    char.health = 0;
    char.status = 'Dead';
    return {
      message: `${char.name} tried to barter passage with a Sinaloa checkpoint. They didn't make it back.`,
      modalImage: 'events/5'
    };
  }
  return null;
}

export function weatherEvent(vehicle) {
  const num = Math.floor(Math.random() * 3);

  if (num === 0) {
    // Heatwave — burns rations faster
    const lost = Math.floor(vehicle.characters.length * 5 * 1.5);
    vehicle.food = Math.max(0, vehicle.food - lost);
    return { message: `A brutal heatwave slows the convoy. Rations spoil faster in the heat — ${lost} lbs lost.` };
  } else if (num === 1) {
    // Rainstorm — adds a travel day
    vehicle.days += 1;
    vehicle.food -= vehicle.dailyFoodCost();
    vehicle.resourceChecker();
    return { message: 'A heavy rainstorm washes out the road. The convoy shelters for a day before pushing on.' };
  } else {
    // Snowstorm — damages health and adds delay
    const index = Math.floor(Math.random() * vehicle.characters.length);
    const char = vehicle.characters[index];
    char.health -= 12;
    vehicle.days += 1;
    vehicle.food -= vehicle.dailyFoodCost();
    vehicle.resourceChecker();
    vehicle.statusAdjuster();
    return { message: `A mountain snowstorm hits without warning. ${char.name} suffers exposure. The convoy loses a day digging out.` };
  }
}

export function antifaEvent() {
  const tax = Math.floor(Math.random() * 150) + 50;
  return {
    type: 'antifa',
    tax,
    message: `An Antifa bloc has barricaded the highway. Masked figures surround your convoy demanding a "community solidarity contribution" of ₿${tax}. Pay up, push through, or fight back.`,
    btn1: { id: 'payAntifa',   label: `Pay ₿${tax}` },
    btn2: { id: 'fightAntifa', label: 'Push Through' },
    btn3: { id: 'fightBack',   label: 'Fight Back (2 rds)' },
  };
}
