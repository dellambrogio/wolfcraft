/** Tracks tile positions that have a placed fence. */
export class FenceSystem {
  private readonly fences = new Set<string>();

  private static key(tx: number, ty: number): string {
    return `${tx},${ty}`;
  }

  /** Place a fence at (tx, ty). Returns false if one already exists there. */
  place(tx: number, ty: number): boolean {
    const k = FenceSystem.key(tx, ty);
    if (this.fences.has(k)) return false;
    this.fences.add(k);
    return true;
  }

  has(tx: number, ty: number): boolean {
    return this.fences.has(FenceSystem.key(tx, ty));
  }

  remove(tx: number, ty: number): boolean {
    return this.fences.delete(FenceSystem.key(tx, ty));
  }
}
