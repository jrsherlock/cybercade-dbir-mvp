import Phaser from "phaser";
import { BALANCE } from "./balance";
import { GameScene } from "./scenes/GameScene";

/**
 * Builds the Phaser game config. Imported only client-side (dynamically, from
 * components/PhaserGame.tsx) so Phaser never touches the server bundle.
 */
export function createGameConfig(
  parent: HTMLElement,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: BALANCE.width,
    height: BALANCE.height,
    backgroundColor: "#0a0b0f",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
  };
}
