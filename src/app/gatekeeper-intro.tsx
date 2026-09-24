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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [gazeOffset, setGazeOffset] = useState<-1 | 0 | 1>(0);
  const [lineIndex, setLineIndex] = useState<number | null>(null);
  const [linePhase, setLinePhase] = useState<LinePhase>("entering");
  const [continueVisible, setContinueVisible] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(motionPreference.matches);
      setVideoReady(false);
    };

    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () => motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

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

  useEffect(() => {
    if (!symbolVisible || showLogin || prefersReducedMotion || videoFailed || videoReady) return;

    let blinkTimer = 0;
    let blinkEndTimer = 0;
    let gazeTimer = 0;
    let active = true;

    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        if (!active) return;
        setBlinking(true);
        blinkEndTimer = window.setTimeout(() => setBlinking(false), 125);
        scheduleBlink();
      }, 4_200 + Math.random() * 5_800);
    };

    const scheduleGaze = () => {
      gazeTimer = window.setTimeout(() => {
        if (!active) return;
        setGazeOffset((current) => {
          const alternatives = ([-1, 0, 1] as const).filter((value) => value !== current);
          return alternatives[Math.floor(Math.random() * alternatives.length)];
        });
        scheduleGaze();
      }, 2_600 + Math.random() * 3_800);
    };

    scheduleBlink();
    scheduleGaze();

    return () => {
      active = false;
      window.clearTimeout(blinkTimer);
      window.clearTimeout(blinkEndTimer);
      window.clearTimeout(gazeTimer);
      setBlinking(false);
      setGazeOffset(0);
    };
  }, [symbolVisible, showLogin, prefersReducedMotion, videoFailed, videoReady]);

  const useVideo = symbolVisible && !prefersReducedMotion && !videoFailed;
  const videoActive = useVideo && videoReady;

  if (showLogin) return children;

  return (
    <main className="gatekeeper" aria-label="Nuisance introduction">
      <button className="gatekeeper-skip" type="button" onClick={() => setShowLogin(true)}>
        Skip and log in
      </button>
      <section className="gatekeeper-stage">
        <div
          className={`gatekeeper-portrait${symbolVisible ? " is-visible" : ""}${blinking ? " is-blinking" : ""}${linePhase !== "exiting" && lineIndex !== null ? " is-speaking" : ""}${videoActive ? " is-video-active" : ""}`}
          data-gaze={gazeOffset}
          aria-hidden="true"
        >
          <Image
            className={`gatekeeper-symbol${symbolVisible ? " is-visible" : ""}`}
            src="/branding/nuisance-face.webp"
            alt=""
            width={420}
            height={565}
            sizes="(max-width: 390px) 112px, 148px"
            priority
          />
          {useVideo && (
            <video
              className={`gatekeeper-portrait-video${videoReady ? " is-ready" : ""}`}
              src="/branding/gatekeeper-idle/idle-v2.webm"
              poster="/branding/nuisance-face.webp"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
              onPlaying={() => setVideoReady(true)}
              onError={() => {
                setVideoReady(false);
                setVideoFailed(true);
              }}
            />
          )}
        </div>
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
