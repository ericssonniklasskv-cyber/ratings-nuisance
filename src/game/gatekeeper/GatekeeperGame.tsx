"use client";

import { useEffect, useRef, useState } from "react";
import { initialGameState, REQUIRED_HITS, type GatekeeperGameState } from "./state";
import type { GatekeeperGameHandle } from "./types";
import styles from "./GatekeeperGame.module.css";

export default function GatekeeperGame({ onComplete }: { onComplete: () => void }) {
  const parent = useRef<HTMLDivElement>(null);
  const handle = useRef<GatekeeperGameHandle | null>(null);
  const complete = useRef(onComplete);
  const [state, setState] = useState<GatekeeperGameState>(initialGameState);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => { complete.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let disposed = false;
    const container = parent.current;
    import("./createGame").then(({ createGame }) => {
      if (disposed || !container) return;
      handle.current = createGame(container, {
        onStateChange: (next) => {
          if (disposed) return;
          setState(next);
          setReady(true);
        },
        onComplete: () => { if (!disposed) complete.current(); },
      });
    }).catch(() => {
      if (!disposed) {
        setLoadFailed(true);
        setState({ status: "failure", hits: 0 });
      }
    });

    return () => {
      disposed = true;
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  const instructions = loadFailed
    ? "Spelet kunde inte laddas. Använd Skip and log in för att fortsätta."
    : !ready ? "Laddar…"
    : state.status === "idle" ? `Starta och tryck på sigillet ${REQUIRED_HITS} gånger. Missar du börjar du om.`
    : state.status === "playing" ? `${state.hits} av ${REQUIRED_HITS}. Tryck på sigillet.`
    : state.status === "failure" ? "Du missade. Försök igen."
    : "Klart. Du får passera.";

  return (
    <section className={styles.game} aria-label="Gatekeeper-minispel" data-game-state={state.status}>
      <h1 className={styles.heading}>Ett sista test.</h1>
      <div className={styles.canvas} ref={parent} />
      <p className={styles.status} role="status" aria-live="polite">{instructions}</p>
      {ready && !loadFailed && state.status !== "success" && (
        <button className={styles.action} type="button" onClick={() => state.status === "playing" ? handle.current?.activate() : handle.current?.start()}>
          {state.status === "playing" ? "Aktivera sigillet" : state.status === "failure" ? "Försök igen" : "Starta"}
        </button>
      )}
    </section>
  );
}
