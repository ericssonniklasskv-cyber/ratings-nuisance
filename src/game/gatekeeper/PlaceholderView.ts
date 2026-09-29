import Phaser from "phaser";
import { REQUIRED_HITS, type GatekeeperGameState } from "./state";

// Replace this presentation with sprites/animations later; keep the scene's rules and input intact.
export class PlaceholderView {
  private target: Phaser.GameObjects.Arc;
  private progress: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onActivate: () => void, onMiss: () => void) {
    scene.add.rectangle(180, 210, 360, 420, 0x080908).setInteractive().on("pointerup", onMiss);

    const face = scene.add.graphics();
    face.lineStyle(2, 0xb98b47, 0.8);
    face.strokeRoundedRect(135, 38, 90, 116, 28);
    face.fillStyle(0xe2b46b, 0.9);
    face.fillCircle(159, 82, 4);
    face.fillCircle(201, 82, 4);
    face.lineBetween(164, 126, 196, 126);

    this.target = scene.add.circle(180, 265, 54, 0xe2b46b).setStrokeStyle(2, 0xf4ce90);
    this.target.setInteractive({ useHandCursor: true });
    this.target.on("pointerup", onActivate);
    scene.add.text(180, 265, "SIGILL", { fontFamily: "Arial", fontSize: "17px", color: "#171914" }).setOrigin(0.5);
    this.progress = scene.add.text(180, 356, `0 / ${REQUIRED_HITS}`, { fontFamily: "Arial", fontSize: "20px", color: "#e9eae4" }).setOrigin(0.5);
  }

  render(state: GatekeeperGameState) {
    const enabled = state.status === "playing";
    this.target.setAlpha(enabled ? 1 : 0.45);
    this.target.setFillStyle(state.status === "success" ? 0xc5d4a1 : 0xe2b46b);
    this.progress.setText(`${state.hits} / ${REQUIRED_HITS}`);
  }
}
