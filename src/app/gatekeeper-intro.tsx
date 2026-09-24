"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const dialogue = ["Jaså.", "Du hittade hit.", "Det gör inte många."];

export function GatekeeperIntro({ children }: { children: ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [symbolVisible, setSymbolVisible] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [continueVisible, setContinueVisible] = useState(false);

  useEffect(() => {
    if (showLogin) return;

    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      schedule(() => setSymbolVisible(true), 0);
      schedule(() => setVisibleLines(dialogue.length), 50);
      schedule(() => setContinueVisible(true), 100);
    } else {
      schedule(() => setSymbolVisible(true), 550);
      schedule(() => setVisibleLines(1), 1_650);
      schedule(() => setVisibleLines(2), 3_050);
      schedule(() => setVisibleLines(3), 4_450);
      schedule(() => setContinueVisible(true), 5_650);
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [showLogin]);

  if (showLogin) return children;

  return (
    <main className="gatekeeper" aria-label="Nuisance introduction">
      <button className="gatekeeper-skip" type="button" onClick={() => setShowLogin(true)}>
        Skip and log in
      </button>
      <section className="gatekeeper-stage">
        <Image
          className={`gatekeeper-symbol${symbolVisible ? " is-visible" : ""}`}
          src="/branding/nuisance-face.webp"
          alt=""
          aria-hidden="true"
          width={420}
          height={565}
          sizes="(max-width: 390px) 112px, 148px"
          priority
        />
        <div className="gatekeeper-dialogue" aria-live="polite" aria-relevant="additions">
          {dialogue.slice(0, visibleLines).map((line) => (
            <p className="gatekeeper-line" key={line}>{line}</p>
          ))}
        </div>
        {continueVisible && (
          <button className="gatekeeper-continue" type="button" onClick={() => setShowLogin(true)}>
            Fortsätt
          </button>
        )}
      </section>
    </main>
  );
}
