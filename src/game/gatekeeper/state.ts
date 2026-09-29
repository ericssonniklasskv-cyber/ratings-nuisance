export type GatekeeperGameStatus = "idle" | "playing" | "success" | "failure";
export type GatekeeperGameAction = "start" | "activate" | "miss";
export type GatekeeperGameState = { status: GatekeeperGameStatus; hits: number };

export const REQUIRED_HITS = 3;
export const initialGameState: GatekeeperGameState = { status: "idle", hits: 0 };

// Gameplay rules have no dependency on Phaser or on the presentation assets.
export function transition(state: GatekeeperGameState, action: GatekeeperGameAction): GatekeeperGameState {
  if (action === "start" && (state.status === "idle" || state.status === "failure")) {
    return { status: "playing", hits: 0 };
  }
  if (state.status !== "playing") return state;
  if (action === "miss") return { ...state, status: "failure" };
  if (action === "activate") {
    const hits = Math.min(REQUIRED_HITS, state.hits + 1);
    return { hits, status: hits === REQUIRED_HITS ? "success" : "playing" };
  }
  return state;
}
