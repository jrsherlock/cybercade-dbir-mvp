import type { GameState, GameResult } from "./types";

/**
 * The React <-> Phaser event bridge. Phaser owns the game loop and is the
 * state of record; it pushes display updates out through this bridge, and
 * React sends commands back in. A plain typed emitter — no Phaser, no deps.
 */
export interface BridgeEvents {
  /** Phaser -> React: display updates. */
  score: number;
  trust: number;
  streak: number;
  state: GameState;
  result: GameResult;
  /** React -> Phaser: (re)start the game. */
  start: void;
}

type Handler<K extends keyof BridgeEvents> = (payload: BridgeEvents[K]) => void;

class GameBridge {
  private handlers = new Map<keyof BridgeEvents, Set<Handler<keyof BridgeEvents>>>();

  /** Subscribe; returns an unsubscribe function. */
  on<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<keyof BridgeEvents>);
    return () => this.off(event, handler);
  }

  off<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as Handler<keyof BridgeEvents>);
  }

  emit<K extends keyof BridgeEvents>(event: K, payload: BridgeEvents[K]): void {
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

/** Module-level singleton shared by the Phaser game and the React UI. */
export const gameBridge = new GameBridge();
