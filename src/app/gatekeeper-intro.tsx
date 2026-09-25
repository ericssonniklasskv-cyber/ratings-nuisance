"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { firstGatekeeperStep, gatekeeperStory, isCorrectGatekeeperAnswer } from "@/lib/gatekeeper-story";

const CHARACTER_STAGGER_MS = 42;
const MAX_STAGGER_SPAN_MS = 1_200;
const CHARACTER_WAVE_MS = 460;
const LINE_EXIT_MS = 300;

type LinePhase = "entering" | "holding" | "exiting";

function getText(stepId: string): string {
  const step = gatekeeperStory[stepId];
  return step.kind === "line" ? step.text : step.prompt;
}

function revealTiming(text: string, reducedMotion: boolean) {
  const characters = Array.from(text).length;
  const stagger = Math.min(CHARACTER_STAGGER_MS, MAX_STAGGER_SPAN_MS / Math.max(1, characters - 1));
  return { stagger, duration: reducedMotion ? 0 : CHARACTER_WAVE_MS + (characters - 1) * stagger };
}

export function GatekeeperIntro({ children }: { children: ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [symbolVisible, setSymbolVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [gazeOffset, setGazeOffset] = useState<-1 | 0 | 1>(0);
  const [stepId, setStepId] = useState<string | null>(null);
  const [linePhase, setLinePhase] = useState<LinePhase>("entering");
  const [contentVisible, setContentVisible] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [tease, setTease] = useState("");
  const [answer, setAnswer] = useState("");
  const choiceTimer = useRef<number | null>(null);

  const step = stepId === null ? null : gatekeeperStory[stepId];
  const text = stepId === null ? "" : getText(stepId);
  const words = text.split(" ");
  const stagger = revealTiming(text, prefersReducedMotion).stagger;

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
    const symbolTimer = window.setTimeout(() => setSymbolVisible(true), reducedMotion ? 0 : 550);
    const firstLineTimer = window.setTimeout(() => setStepId(firstGatekeeperStep), reducedMotion ? 0 : 1_650);
    return () => {
      window.clearTimeout(symbolTimer);
      window.clearTimeout(firstLineTimer);
    };
  }, [showLogin]);

  useEffect(() => {
    if (!step || showLogin) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { duration } = revealTiming(getText(stepId!), reducedMotion);
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => timers.push(window.setTimeout(callback, delay));

    schedule(() => {
      setLinePhase(reducedMotion ? "holding" : "entering");
      setContentVisible(false);
      setSecretRevealed(false);
      setTease("");
    }, 0);
    schedule(() => {
      setLinePhase("holding");
      if (step.kind !== "line") {
        setContentVisible(true);
        return;
      }
      const readingTime = Math.min(3_200, Math.max(1_100, step.text.length * 28));
      schedule(() => {
        if (!reducedMotion) setLinePhase("exiting");
        schedule(() => setStepId(step.next), reducedMotion ? 0 : LINE_EXIT_MS);
      }, readingTime);
    }, duration);

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [step, stepId, showLogin]);

  useEffect(() => () => {
    if (choiceTimer.current !== null) window.clearTimeout(choiceTimer.current);
  }, []);

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

  function openLogin() {
    if (choiceTimer.current !== null) window.clearTimeout(choiceTimer.current);
    setShowLogin(true);
  }

  function choose(option: { id: string; next?: string }) {
    if (choiceTimer.current !== null) return;
    if (!option.next) {
      setSecretRevealed(true);
      setTease(option.id === "2A" ? "Försök inte, Bohlin." : "");
      return;
    }
    setContentVisible(false);
    if (prefersReducedMotion) {
      setStepId(option.next);
      return;
    }
    setLinePhase("exiting");
    choiceTimer.current = window.setTimeout(() => {
      choiceTimer.current = null;
      setStepId(option.next!);
    }, LINE_EXIT_MS);
  }

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCorrectGatekeeperAnswer(answer)) openLogin();
  }

  const useVideo = symbolVisible && !prefersReducedMotion && !videoFailed;
  const videoActive = useVideo && videoReady;

  if (showLogin) return children;

  return (
    <main className="gatekeeper gatekeeper-story" aria-label="Nuisance-introduktion" lang="sv">
      <button className="gatekeeper-skip" type="button" onClick={openLogin} lang="en">
        Skip and log in
      </button>
      <section className="gatekeeper-stage">
        <div
          className={`gatekeeper-portrait${symbolVisible ? " is-visible" : ""}${blinking ? " is-blinking" : ""}${step && linePhase !== "exiting" ? " is-speaking" : ""}${videoActive ? " is-video-active" : ""}`}
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
          {step && (
            <p className={`gatekeeper-line is-${linePhase}`} aria-hidden="true" key={stepId}>
              {words.map((word, wordIndex) => {
                const offset = words.slice(0, wordIndex).join(" ").length + (wordIndex ? 1 : 0);
                return <Fragment key={`${wordIndex}-${word}`}>
                  <span className="gatekeeper-word">
                    {Array.from(word).map((character, index) => (
                      <span
                        className="gatekeeper-char"
                        key={`${index}-${character}`}
                        style={{ animationDelay: `${(offset + index) * stagger}ms` }}
                      >
                        {character}
                      </span>
                    ))}
                  </span>
                  {wordIndex < words.length - 1 ? " " : null}
                </Fragment>;
              })}
            </p>
          )}
          <span className="visually-hidden">{text}</span>
        </div>
        {contentVisible && step?.kind === "choice" && (
          <div className="gatekeeper-options" role="group" aria-label={step.prompt}>
            {step.options.filter((option) => !option.hiddenUntilAttempt || secretRevealed).map((option) => (
              <button className={`gatekeeper-option${option.hiddenUntilAttempt ? " is-secret" : ""}`} type="button" key={option.id} onClick={() => choose(option)}>
                {option.label.trim()}
              </button>
            ))}
            <p className="gatekeeper-tease" role="status" aria-live="polite">{tease || (secretRevealed ? <span className="visually-hidden">Ett tredje svar dök upp.</span> : null)}</p>
          </div>
        )}
        {contentVisible && step?.kind === "answer" && (
          <div className="gatekeeper-answer">
            <form onSubmit={submitAnswer}>
              <label className="visually-hidden" htmlFor="gatekeeper-answer">Fullständigt namn</label>
              <input id="gatekeeper-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} autoComplete="off" placeholder="Fullständigt namn" />
              <button type="submit">Svara</button>
            </form>
            <details className="gatekeeper-hint">
              <summary>Ledtråd</summary>
              <p>{step.hint}</p>
            </details>
          </div>
        )}
      </section>
    </main>
  );
}
