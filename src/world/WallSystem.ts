/** Tracks tile positions that have a placed wood wall. */
export class WallSystem {
  private readonly walls = new Set<string>();

  private static key(tx: number, ty: number): string {
    return `${tx},${ty}`;
  }

  /** Place a wall at (tx, ty). Returns false if one already exists there. */
  place(tx: number, ty: number): boolean {
    const k = WallSystem.key(tx, ty);
    if (this.walls.has(k)) return false;
    this.walls.add(k);
    return true;
  }

  has(tx: number, ty: number): boolean {
    return this.walls.has(WallSystem.key(tx, ty));
  }

  remove(tx: number, ty: number): boolean {
    return this.walls.delete(WallSystem.key(tx, ty));
  }
}
