export interface Inventory {
  wood: number;
  stone: number;
  water: number;
  grass: number;
  wheat: number;
  meat: number;
  vegetables: number;
  // Tools — improve gather probability for their resource
  axe:     number;  // wood
  pickaxe: number;  // stone
  knife:   number;  // grass
  // Placeable items
  fire:       number;
  // Cooked food
  cookedMeat: number;
  bread:      number;
}

export class ResourceSystem {
  private inventory: Inventory = {
    wood: 0,
    stone: 0,
    water: 0,
    grass: 0,
    wheat: 0,
    meat: 0,
    vegetables: 0,
    axe:     0,
    pickaxe: 0,
    knife:   0,
    fire:       0,
    cookedMeat: 0,
    bread:      0,
  };

  add(resource: keyof Inventory, amount: number): void {
    this.inventory[resource] = Math.max(0, this.inventory[resource] + amount);
  }

  subtract(resource: keyof Inventory, amount: number): void {
    this.inventory[resource] = Math.max(0, this.inventory[resource] - amount);
  }

  get(resource: keyof Inventory): number {
    return this.inventory[resource];
  }

  getAll(): Readonly<Inventory> {
    return { ...this.inventory };
  }

  has(resource: keyof Inventory, amount: number): boolean {
    return this.inventory[resource] >= amount;
  }
}
