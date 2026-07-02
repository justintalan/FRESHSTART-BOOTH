"use client";

import { useCallback, useEffect, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Hud, Pill, fmtClock } from "../../components/Hud";
import { Kicker, BigButton } from "../../components/Bits";
import { Leaderboard } from "../../components/Leaderboard";
import { NameEntry } from "../../components/NameEntry";
import { EndActions } from "../../components/EndActions";
import { addScore } from "../../lib/leaderboard";
import type { ScoreEntry } from "../../lib/types";
import { useCountdown } from "../../hooks/useCountdown";

interface Message {
  from: string;
  subject: string;
  body: string;
  link: string;
  phish: boolean;
  why?: string;
}

type Phase = "intro" | "play" | "score" | "board";

const ROUND_SECONDS = 8;
const REVEAL_MS = 1400;

// Each round is a pair: exactly one legit, one phishing message.
const ROUNDS: readonly [Message, Message][] = [
  [
    {
      from: "officers@itec-uap.org",
      subject: "FreshStart booth schedule",
      body: "Hi! Here's the booth roster for Friday. Reply if you can cover the 2pm slot. See you at the plaza.",
      link: "itec-uap.org/freshstart",
      phish: false,
    },
    {
      from: "it-support@1tec-uap-secure.net",
      subject: "URGENT: account will be DELETED",
      body: "Your student acount is suspend!! Verify NOW within 24hr or lose acces forever. Click below and enter your password.",
      link: "http://1tec-verify-login.ru/secure?id=442",
      phish: true,
      why: "lookalike domain (1tec) + urgency + typos + asks for your password",
    },
  ],
  [
    {
      from: "registrar@uap.asia",
      subject: "Enlistment window opens Monday",
      body: "Advising slots for next term are now on the portal. Log in through the official student page to pick your subjects. Questions? Visit the Registrar at CTC 3F.",
      link: "uap.asia/students/enlistment",
      phish: false,
    },
    {
      from: "scholarships@uap-grants-verify.com",
      subject: "Claim your ₱25,000 grant TODAY",
      body: "Congratulations!! You were selected for a surprise grant. To release funds, confirm your bank OTP and pay a ₱500 processing fee via the link now.",
      link: "http://uap-grants-verify.com/claim?ref=pay",
      phish: true,
      why: "too-good-to-be-true prize + asks for your OTP + upfront 'processing fee'",
    },
  ],
  [
    {
      from: "helpdesk@itec-uap.org",
      subject: "Wi-Fi maintenance this weekend",
      body: "Campus Wi-Fi will be down Sat 1-4am for upgrades. No action needed on your end. Reset your password anytime at the official IT portal if you have trouble.",
      link: "itec-uap.org/it/status",
      phish: false,
    },
    {
      from: "microsft-365@login-uap-secure.info",
      subject: "Re: Your mailbox is FULL — action required",
      body: "You have 12 pending mesages held. Your mailbox will be closed in 2 hours unless you re-validate. Sign in here with your school email and password to keep your inbox.",
      link: "http://login-uap-secure.info/owa/validate",
      phish: true,
      why: "misspelled sender (microsft) + fake deadline + harvests your login",
    },
  ],
];

function MessageCard({
  msg,
  onPick,
  revealed,
  disabled,
}: {
  msg: Message;
  onPick: () => void;
  revealed: boolean;
  disabled: boolean;
}) {
  // On reveal: rose glow for the phish, green for the legit.
  const revealStyle = revealed
    ? msg.phish
      ? {
          borderColor: "#fb7185",
          boxShadow: "0 0 0 2px #fb7185, 0 0 26px rgba(251,113,133,.35)",
        }
      : {
          borderColor: "#34d399",
          boxShadow: "0 0 0 2px #34d399, 0 0 26px rgba(52,211,153,.28)",
        }
    : undefined;

  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className="w-[400px] rounded-2xl border border-border bg-panel p-[22px] text-left text-[16px] transition-transform enabled:hover:border-[color:var(--a)] enabled:active:scale-[.98] disabled:cursor-default"
      style={revealStyle}
    >
      <span className="mb-2 block font-mono text-[14px] text-dim">
        {msg.from}
      </span>
      <span className="mb-[10px] block text-[20px] font-bold">
        {msg.subject}
      </span>
      <span className="block leading-[1.6]" style={{ color: "#c7d2e6" }}>
        {msg.body}
      </span>
      <span className="mt-[10px] block break-all font-mono text-[14px] text-cyan">
        {msg.link}
      </span>
      {revealed ? (
        <span
          className="mt-3 block font-mono text-[13px]"
          style={{ color: msg.phish ? "#fb7185" : "#34d399" }}
        >
          {msg.phish ? `🚩 SCAM — ${msg.why ?? ""}` : "✓ Legit message"}
        </span>
      ) : null}
    </button>
  );
}

export default function SpotPhish() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [spotted, setSpotted] = useState(0);
  const [order, setOrder] = useState<[Message, Message] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [meIndex, setMeIndex] = useState<number | undefined>(undefined);

  const { remaining, start, stop, reset } = useCountdown({
    seconds: ROUND_SECONDS,
    onDone: () => {
      // Time ran out with no valid pick — reveal, no points.
      setLocked(true);
      setRevealed(true);
    },
  });

  // Shuffle the pair's left/right position AFTER mount to avoid hydration
  // mismatch, then arm the round timer.
  useEffect(() => {
    if (phase !== "play") return;
    const pair = ROUNDS[round];
    const flip = Math.random() < 0.5;
    setOrder(flip ? [pair[1], pair[0]] : [pair[0], pair[1]]);
    setRevealed(false);
    setLocked(false);
    reset(ROUND_SECONDS);
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  // Advance to the next round (or the score screen) after the reveal beat.
  useEffect(() => {
    if (!revealed) return;
    const h = window.setTimeout(() => {
      if (round + 1 < ROUNDS.length) {
        setRound((r) => r + 1);
      } else {
        setPhase("score");
      }
    }, REVEAL_MS);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const pick = useCallback(
    (msg: Message) => {
      if (locked) return;
      setLocked(true);
      stop();
      if (msg.phish) {
        setScore((s) => s + 100);
        setSpotted((n) => n + 1);
      }
      setRevealed(true);
    },
    [locked, stop],
  );

  const startGame = useCallback(() => {
    setScore(0);
    setSpotted(0);
    setRound(0);
    setPhase("play");
  }, []);

  const save = useCallback(
    (name: string) => {
      const { board: b, rank } = addScore("spot-phish", {
        name,
        score,
        ts: Date.now(),
      });
      setBoard(b);
      setMeIndex(rank ? rank - 1 : undefined);
      setPhase("board");
    },
    [score],
  );

  const restart = useCallback(() => {
    setScore(0);
    setSpotted(0);
    setRound(0);
    setBoard([]);
    setMeIndex(undefined);
    setPhase("intro");
  }, []);

  return (
    <GameShell ribbon="06 · SPOT THE PHISH" accent="#fb7185">
      {phase === "intro" ? (
        <div className="flex flex-col items-center">
          <Kicker>Security drill · scored</Kicker>
          <h1 className="mb-3 text-[48px] font-bold leading-tight">
            WHICH ONE&apos;S THE <span className="grad">SCAM?</span>
          </h1>
          <p className="max-w-[640px] text-[20px] text-dim-2">
            Two messages, one is real and one is a phishing attempt. Tap the
            scam before the 8-second timer runs out. Three rounds — spot as many
            as you can.
          </p>
          <BigButton onClick={startGame}>START →</BigButton>
        </div>
      ) : null}

      {phase === "play" ? (
        <div className="flex flex-col items-center">
          <Hud>
            <Pill label="⏱" value={fmtClock(remaining)} />
            <Pill label="SCORE" value={score} />
            <Pill label="ROUND" value={`${round + 1}/${ROUNDS.length}`} />
          </Hud>
          <h1 className="mb-[6px] text-[48px] font-bold leading-tight">
            WHICH ONE&apos;S THE <span className="grad">SCAM?</span>
          </h1>
          <div className="mb-[14px] text-[18px] text-dim-2">
            Tap the phishing message before the timer ends
          </div>
          <div className="flex gap-[26px]">
            {order
              ? order.map((msg, i) => (
                  <MessageCard
                    key={`${round}-${i}`}
                    msg={msg}
                    onPick={() => pick(msg)}
                    revealed={revealed}
                    disabled={locked}
                  />
                ))
              : null}
          </div>
        </div>
      ) : null}

      {phase === "score" ? (
        <NameEntry score={score} onSubmit={save} />
      ) : null}

      {phase === "board" ? (
        <div className="flex flex-col items-center">
          <h1 className="mb-2 text-[40px] font-bold">
            <span className="grad">Nice work.</span>
          </h1>
          <p className="mb-6 text-[20px] text-dim-2">
            You spotted {spotted} of {ROUNDS.length} scams
          </p>
          <Leaderboard variant="panel" entries={board} meIndex={meIndex} />
          <EndActions onPlayAgain={restart} />
        </div>
      ) : null}
    </GameShell>
  );
}
