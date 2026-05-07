export class Character {
  constructor(name, isPet = false) {
    this.name = name;
    this.isPet = isPet;
    this.health = 100;
    this.status = 'Good';
    this.illness = [];
  }

  // Returns a message string if a condition was contracted, otherwise null
  illnessGenerator() {
    const num = Math.floor(Math.random() * 80);
    const humanIllnesses = {
      1: 'Radiation Sickness',
      2: 'Infected Wound',
      3: 'Fever',
      4: 'Stomach Bug',
      5: 'Fracture'
    };
    const petIllnesses = {
      1: 'Threw Up',
      2: 'Lethargic'
    };
    const illnessMap = this.isPet ? petIllnesses : humanIllnesses;
    const illness = illnessMap[num];
    if (illness && !this.illness.includes(illness)) {
      this.illness.push(illness);
      return `${this.name} ${this.isPet ? 'is' : 'contracted'} ${illness}`;
    }
    return null;
  }
}
