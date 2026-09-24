"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const dialogue = ["Jaså.", "Du hittade hit.", "Det gör inte många."];
const CHARACTER_STAGGER_MS = 42;
const CHARACTER_WAVE_MS = 460;
const LINE_HOLD_MS = 600;
const LINE_EXIT_MS = 300;
const CONTINUE_PAUSE_MS = 350;

type LinePhase = "entering" | "holding" | "exiting";

export function GatekeeperIntro({ children }: { children: ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [symbolVisible, setSymbolVisible] = useState(false);
  const [lineIndex, setLineIndex] = useState<number | null>(null);
  const [linePhase, setLinePhase] = useState<LinePhase>("entering");
  const [continueVisible, setContinueVisible] = useState(false);

  useEffect(() => {
    if (showLogin) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    const showLine = (index: number) => {
      const text = dialogue[index];
      setLineIndex(index);
      setLinePhase(reducedMotion ? "holding" : "entering");

      const revealDuration = reducedMotion
        ? 0
        : CHARACTER_WAVE_MS + (Array.from(text).length - 1) * CHARACTER_STAGGER_MS;

      schedule(() => {
        if (!reducedMotion) setLinePhase("holding");

        schedule(() => {
          if (!reducedMotion) setLinePhase("exiting");

          schedule(() => {
            if (index < dialogue.length - 1) {
              showLine(index + 1);
            } else {
              schedule(() => setContinueVisible(true), reducedMotion ? 0 : CONTINUE_PAUSE_MS);
            }
          }, reducedMotion ? 0 : LINE_EXIT_MS);
        }, reducedMotion ? 750 : LINE_HOLD_MS);
      }, revealDuration);
    };

    schedule(() => setSymbolVisible(true), reducedMotion ? 0 : 550);
    schedule(() => showLine(0), reducedMotion ? 0 : 1_650);

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
        <div className="gatekeeper-dialogue" aria-live="polite" aria-atomic="true">
          {lineIndex !== null && (
            <p className={`gatekeeper-line is-${linePhase}`} aria-hidden="true" key={lineIndex}>
              {Array.from(dialogue[lineIndex]).map((character, index) => (
                <span
                  className="gatekeeper-char"
                  key={`${index}-${character}`}
                  style={{ animationDelay: `${index * CHARACTER_STAGGER_MS}ms` }}
                >
                  {character === " " ? "\u00a0" : character}
                </span>
              ))}
            </p>
          )}
          <span className="visually-hidden">{lineIndex === null ? "" : dialogue[lineIndex]}</span>
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
