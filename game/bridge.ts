import type { GameState, GameResult, WaveInfo } from "./types";

/**
 * The React <-> Phaser event bridge. Phaser owns the game loop and is the
 * state of record; it pushes display updates out through this bridge, and
 * React sends commands back in. A plain typed emitter — no Phaser, no deps.
 *
 * Display events are cached: a late subscriber (e.g. the HUD mounting just
 * after a game starts) immediately receives the most recent value.
 */
export interface BridgeEvents {
  /** Phaser -> React: display updates. */
  score: number;
  trust: number;
  streak: number;
  state: GameState;
  wave: WaveInfo;
  result: GameResult;
  /** React -> Phaser: (re)start the game. Commands are never cached. */
  start: void;
}

type Handler<K extends keyof BridgeEvents> = (payload: BridgeEvents[K]) => void;

class GameBridge {
  private handlers = new Map<keyof BridgeEvents, Set<Handler<keyof BridgeEvents>>>();
  private last = new Map<keyof BridgeEvents, unknown>();

  /** Subscribe; returns an unsubscribe function. Replays the last value. */
  on<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<keyof BridgeEvents>);

    if (event !== "start" && this.last.has(event)) {
      handler(this.last.get(event) as BridgeEvents[K]);
    }
    return () => this.off(event, handler);
  }

  off<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as Handler<keyof BridgeEvents>);
  }

  emit<K extends keyof BridgeEvents>(event: K, payload: BridgeEvents[K]): void {
    if (event !== "start") this.last.set(event, payload);
    this.handlers.get(event)?.forEach((h) => h(payload));
  }
}

/** Module-level singleton shared by the Phaser game and the React UI. */
export const gameBridge = new GameBridge();
