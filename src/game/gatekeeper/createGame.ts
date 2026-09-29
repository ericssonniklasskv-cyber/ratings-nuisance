// This module is imported only from a mounted client component's effect.
import Phaser from "phaser";
import { GatekeeperScene } from "./scenes/GatekeeperScene";
import { COMPLETE_EVENT, STATE_EVENT, type GatekeeperGameCallbacks, type GatekeeperGameHandle } from "./types";

export function createGame(parent: HTMLDivElement, callbacks: GatekeeperGameCallbacks): GatekeeperGameHandle {
  const scene = new GatekeeperScene();
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    backgroundColor: "#080908",
    width: 360,
    height: 420,
    banner: false,
    audio: { noAudio: true },
    fps: { target: 30 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 1 },
    scene: [scene],
    callbacks: { postBoot: (instance) => instance.canvas.setAttribute("aria-hidden", "true") },
  });
  game.events.on(STATE_EVENT, callbacks.onStateChange);
  game.events.once(COMPLETE_EVENT, callbacks.onComplete);

  // Parent size changes can happen independently of a window resize.
  const observer = new ResizeObserver(() => {
    game.scale.getParentBounds();
    game.scale.refresh();
  });
  observer.observe(parent);
  let destroyed = false;

  return {
    start: () => { if (!destroyed) scene.dispatch("start"); },
    activate: () => { if (!destroyed) scene.dispatch("activate"); },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      game.events.off(STATE_EVENT, callbacks.onStateChange);
      game.events.off(COMPLETE_EVENT, callbacks.onComplete);
      // Phaser releases its loop, input listeners, scenes and canvas on the next frame.
      game.destroy(true);
    },
  };
}
