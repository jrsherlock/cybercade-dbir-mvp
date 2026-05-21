import Phaser from "phaser";
import { gameBridge } from "../bridge";
import { BALANCE } from "../balance";
import { ITEMS, LANES, RESPONSES, WAVES } from "../content/dbir-2026";
import type { LaneId, ResponseId, WaveDef } from "../types";
import { ThreatItem } from "../objects/ThreatItem";
import { sfx } from "../sfx";
import { scoreResolution } from "@/lib/scoring";

const COLORS = {
  teal: "#3ee6c4",
  danger: "#ff8a8a",
  muted: "#9aa0ad",
};

/**
 * The "Spot it / Stop it" game loop across four escalating DBIR waves. Phaser
 * owns all gameplay and wave sequencing; it pushes score/trust/streak/wave/
 * state out through the bridge for the React HUD to render.
 */
export class GameScene extends Phaser.Scene {
  private items: ThreatItem[] = [];
  private selected: ThreatItem | null = null;

  private score = 0;
  private trust = BALANCE.trustMax;
  private streak = 0;
  private bestStreak = 0;
  private correct = 0;
  private mistakes = 0;
  private threatsStopped = 0;

  private waveIndex = 0;
  private spawnQueue: string[] = [];
  private spawnsDone = false;
  private inInterstitial = false;
  private currentFallSpeed = 80;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private playing = false;

  private laneX = {} as Record<LaneId, number>;
  private feedbackText!: Phaser.GameObjects.Text;
  private feedbackTween?: Phaser.Tweens.Tween;
  private bannerTitle!: Phaser.GameObjects.Text;
  private bannerSubtitle!: Phaser.GameObjects.Text;
  private unsubStart?: () => void;

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0a0b0f");
    this.drawBoard();
    this.buildResponseBar();

    this.feedbackText = this.add
      .text(BALANCE.width / 2, 650, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        color: COLORS.muted,
        align: "center",
        fontStyle: "bold",
        wordWrap: { width: BALANCE.width - 44 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(20);

    this.bannerTitle = this.add
      .text(BALANCE.width / 2, 322, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: "#f4f5f7",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);

    this.bannerSubtitle = this.add
      .text(BALANCE.width / 2, 366, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(30);

    // Tap empty space to deselect.
    this.input.on(
      "pointerdown",
      (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (over.length === 0) this.selectItem(null);
      },
    );

    this.unsubStart = gameBridge.on("start", () => this.startGame());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubStart?.());

    gameBridge.emit("state", "idle");
  }

  private drawBoard(): void {
    const laneW = BALANCE.width / LANES.length;
    const top = BALANCE.hudZoneY;
    const colTop = top + 26;

    LANES.forEach((lane, i) => {
      const cx = (i + 0.5) * laneW;
      this.laneX[lane.id] = cx;

      this.add
        .rectangle(
          cx,
          (colTop + BALANCE.breachLineY) / 2,
          laneW - 6,
          BALANCE.breachLineY - colTop,
          0x10131a,
        )
        .setStrokeStyle(1, 0x1c2029);

      this.add
        .text(cx, top + 4, lane.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "11px",
          color: COLORS.muted,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
    });

    this.add
      .rectangle(BALANCE.width / 2, BALANCE.breachLineY, BALANCE.width - 16, 3, 0xff5d5d)
      .setAlpha(0.75);
    this.add
      .text(BALANCE.width - 12, BALANCE.breachLineY - 12, "BREACH LINE", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "9px",
        color: "#ff5d5d",
        fontStyle: "bold",
      })
      .setOrigin(1, 1);
  }

  private buildResponseBar(): void {
    const pad = 16;
    const gap = 10;
    const count = RESPONSES.length;
    const btnW = (BALANCE.width - pad * 2 - gap * (count - 1)) / count;
    const btnH = 60;
    const cy = 712;

    RESPONSES.forEach((resp, i) => {
      const cx = pad + btnW / 2 + i * (btnW + gap);

      const btn = this.add
        .rectangle(cx, cy, btnW, btnH, 0x161922)
        .setStrokeStyle(2, resp.tint)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(cx, cy, resp.label, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          color: "#f4f5f7",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      btn.on("pointerdown", () => this.onResponse(resp.id));
      btn.on("pointerover", () => btn.setFillStyle(0x20242f));
      btn.on("pointerout", () => btn.setFillStyle(0x161922));
    });
  }

  private startGame(): void {
    this.clearItems();
    this.score = 0;
    this.trust = BALANCE.trustMax;
    this.streak = 0;
    this.bestStreak = 0;
    this.correct = 0;
    this.mistakes = 0;
    this.threatsStopped = 0;
    this.waveIndex = 0;
    this.playing = true;

    gameBridge.emit("score", 0);
    gameBridge.emit("trust", this.trust);
    gameBridge.emit("streak", 0);
    gameBridge.emit("state", "playing");

    this.startWave(0);
  }

  private startWave(index: number): void {
    this.waveIndex = index;
    const wave = WAVES[index];
    this.spawnQueue = [...wave.spawns];
    this.spawnsDone = false;
    this.currentFallSpeed = wave.fallSpeed;
    this.inInterstitial = true;

    gameBridge.emit("wave", {
      index: wave.index,
      total: WAVES.length,
      name: wave.name,
      isBoss: !!wave.isBoss,
    });

    this.showWaveBanner(wave);
    this.time.delayedCall(BALANCE.interstitialMs, () => {
      if (!this.playing) return;
      this.inInterstitial = false;
      this.beginSpawning(wave);
    });
  }

  private showWaveBanner(wave: WaveDef): void {
    const boss = !!wave.isBoss;
    this.bannerTitle
      .setText(boss ? "⚠ FINAL WAVE" : `WAVE ${wave.index}`)
      .setColor(boss ? "#ff5d5d" : "#3ee6c4");
    this.bannerSubtitle.setText(boss ? wave.name.toUpperCase() : wave.name);

    for (const t of [this.bannerTitle, this.bannerSubtitle]) {
      t.setAlpha(0).setScale(0.8);
    }
    if (boss) this.cameras.main.flash(420, 60, 8, 8);
    sfx.wave();

    this.tweens.add({
      targets: [this.bannerTitle, this.bannerSubtitle],
      alpha: 1,
      scale: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
    this.time.delayedCall(BALANCE.interstitialMs - 440, () => {
      this.tweens.add({
        targets: [this.bannerTitle, this.bannerSubtitle],
        alpha: 0,
        duration: 380,
      });
    });
  }

  private beginSpawning(wave: WaveDef): void {
    this.spawnNext();
    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: wave.spawnInterval,
      loop: true,
      callback: () => this.spawnNext(),
    });
  }

  private spawnNext(): void {
    const id = this.spawnQueue.shift();
    if (!id) {
      this.spawnsDone = true;
      this.spawnTimer?.remove();
      this.spawnTimer = undefined;
      return;
    }
    const itemDef = ITEMS[id];
    const item = new ThreatItem(
      this,
      this.laneX[itemDef.lane],
      BALANCE.spawnY,
      itemDef,
    );
    item.on("pointerdown", () => this.selectItem(item));
    this.items.push(item);
  }

  update(_time: number, delta: number): void {
    if (!this.playing || this.inInterstitial) return;
    const dy = this.currentFallSpeed * (delta / 1000);
    for (const item of [...this.items]) {
      item.y += dy;
      if (item.y >= BALANCE.breachLineY) this.itemBreached(item);
    }
  }

  private selectItem(item: ThreatItem | null): void {
    if (item?.resolved) return;
    if (this.selected && this.selected !== item) this.selected.setSelected(false);
    this.selected = item;
    if (item) {
      item.setSelected(true);
      sfx.select();
    }
  }

  private onResponse(response: ResponseId): void {
    if (!this.playing) return;
    if (!this.selected) {
      this.showFeedback("Tap a threat first, then choose a response.", COLORS.muted);
      return;
    }
    this.resolve(this.selected, response);
  }

  private resolve(item: ThreatItem, response: ResponseId): void {
    if (item.resolved) return;

    const isCorrect = item.def.isThreat && item.def.correctResponse === response;
    const span = BALANCE.breachLineY - BALANCE.spawnY;
    const timeRatio = Phaser.Math.Clamp(
      (BALANCE.breachLineY - item.y) / span,
      0,
      1,
    );

    this.detachItem(item);

    if (isCorrect) {
      const points = scoreResolution({ correct: true, timeRatio, streak: this.streak });
      this.score += points;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.correct += 1;
      this.threatsStopped += 1;
      this.showFeedback(`+${points}   ${item.def.fact}`, COLORS.teal);
      sfx.correct();
      this.popItem(item, true);
    } else {
      this.trust -= 1;
      this.streak = 0;
      this.mistakes += 1;
      const why = item.def.isThreat
        ? `Not quite. ${item.def.fact}`
        : `That one was legit — don't overreact. ${item.def.fact}`;
      this.showFeedback(`⚠ ${why}`, COLORS.danger);
      sfx.wrong();
      this.cameras.main.shake(150, 0.006);
      this.popItem(item, false);
    }

    gameBridge.emit("score", this.score);
    gameBridge.emit("trust", this.trust);
    gameBridge.emit("streak", this.streak);

    if (this.trust <= 0) this.endGame(false);
    else this.checkWaveEnd();
  }

  private itemBreached(item: ThreatItem): void {
    this.detachItem(item);
    if (item.def.isThreat) {
      this.trust -= 1;
      this.streak = 0;
      this.mistakes += 1;
      this.showFeedback(`⚠ Breach! ${item.def.label} got through.`, COLORS.danger);
      sfx.breach();
      this.cameras.main.shake(240, 0.011);
      gameBridge.emit("trust", this.trust);
      gameBridge.emit("streak", this.streak);
    } else {
      this.showFeedback("✓ Safe — that one was legit.", COLORS.muted);
    }
    this.popItem(item, false);

    if (this.trust <= 0) this.endGame(false);
    else this.checkWaveEnd();
  }

  private detachItem(item: ThreatItem): void {
    item.resolved = true;
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    if (this.selected === item) this.selected = null;
  }

  private popItem(item: ThreatItem, correct: boolean): void {
    this.tweens.add({
      targets: item,
      scale: correct ? 1.3 : 0.85,
      alpha: 0,
      duration: 200,
      ease: "Quad.easeOut",
      onComplete: () => item.destroy(),
    });
  }

  private clearItems(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.items.forEach((it) => it.destroy());
    this.items = [];
    this.selected = null;
  }

  private checkWaveEnd(): void {
    if (!this.playing || this.inInterstitial) return;
    if (!this.spawnsDone || this.items.length > 0) return;

    if (this.waveIndex < WAVES.length - 1) {
      this.startWave(this.waveIndex + 1);
    } else {
      this.endGame(true);
    }
  }

  private endGame(survived: boolean): void {
    if (!this.playing) return;
    this.playing = false;
    this.clearItems();

    const total = this.correct + this.mistakes;
    if (survived) sfx.win();
    else sfx.lose();

    gameBridge.emit("state", "over");
    gameBridge.emit("result", {
      score: this.score,
      threatsStopped: this.threatsStopped,
      accuracy: total > 0 ? this.correct / total : 1,
      bestStreak: this.bestStreak,
      wavesCleared: survived ? WAVES.length : this.waveIndex,
      survived,
    });
  }

  private showFeedback(text: string, color: string): void {
    this.feedbackTween?.stop();
    this.feedbackText.setText(text).setColor(color).setAlpha(1);
    this.feedbackTween = this.tweens.add({
      targets: this.feedbackText,
      alpha: 0,
      delay: 1500,
      duration: 1100,
    });
  }
}
