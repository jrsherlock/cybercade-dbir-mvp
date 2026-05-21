import Phaser from "phaser";
import type { GameItemDef } from "../types";

export const ITEM_W = 100;
export const ITEM_H = 94;

/**
 * A single falling item — either a threat or a legit decoy. A Container of
 * placeholder shapes (real art swapped in at M6). The scene owns its motion.
 */
export class ThreatItem extends Phaser.GameObjects.Container {
  readonly def: GameItemDef;
  resolved = false;

  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly ring: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, def: GameItemDef) {
    super(scene, x, y);
    this.def = def;

    this.ring = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      ITEM_W + 12,
      ITEM_H + 12,
      0x3ee6c4,
    ).setVisible(false);

    this.bg = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      ITEM_W,
      ITEM_H,
      0x161922,
    ).setStrokeStyle(2, 0x2c3040);

    const icon = new Phaser.GameObjects.Text(scene, 0, -18, def.icon, {
      fontSize: "32px",
    }).setOrigin(0.5);

    const label = new Phaser.GameObjects.Text(scene, 0, 26, def.label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#c4c8d2",
      align: "center",
      wordWrap: { width: ITEM_W - 14 },
    }).setOrigin(0.5);

    this.add([this.ring, this.bg, icon, label]);
    this.setSize(ITEM_W, ITEM_H);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-ITEM_W / 2, -ITEM_H / 2, ITEM_W, ITEM_H),
      Phaser.Geom.Rectangle.Contains,
    );
    scene.add.existing(this);
  }

  setSelected(on: boolean): void {
    this.ring.setVisible(on);
    this.bg.setStrokeStyle(2, on ? 0x3ee6c4 : 0x2c3040);
  }
}
