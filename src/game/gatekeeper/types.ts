import type { GatekeeperGameState } from "./state";

export const STATE_EVENT = "gatekeeper:state";
export const COMPLETE_EVENT = "gatekeeper:complete";

export type GatekeeperGameCallbacks = {
  onStateChange: (state: GatekeeperGameState) => void;
  onComplete: () => void;
};

export type GatekeeperGameHandle = {
  start: () => void;
  activate: () => void;
  destroy: () => void;
};
