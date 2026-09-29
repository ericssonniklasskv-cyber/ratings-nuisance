import Phaser from "phaser";
import { PlaceholderView } from "../PlaceholderView";
import { initialGameState, transition, type GatekeeperGameAction, type GatekeeperGameState } from "../state";
import { COMPLETE_EVENT, STATE_EVENT } from "../types";

export class GatekeeperScene extends Phaser.Scene {
  private state: GatekeeperGameState = { ...initialGameState };
  private view?: PlaceholderView;
  private ready = false;

  constructor() {
    super({ key: "GatekeeperScene" });
  }

  create() {
    this.state = { ...initialGameState };
    this.view = new PlaceholderView(this, () => this.dispatch("activate"), () => this.dispatch("miss"));
    this.ready = true;
    this.view.render(this.state);
    this.game.events.emit(STATE_EVENT, this.state);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.ready = false; });
  }

  dispatch(action: GatekeeperGameAction) {
    if (!this.ready) return;
    const next = transition(this.state, action);
    if (next === this.state) return;
    this.state = next;
    this.view?.render(next);
    this.game.events.emit(STATE_EVENT, next);
    if (next.status === "success") {
      this.time.delayedCall(550, () => this.game.events.emit(COMPLETE_EVENT));
    }
  }
}
