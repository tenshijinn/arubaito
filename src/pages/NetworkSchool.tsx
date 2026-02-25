import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import arubaitoLogo from "@/assets/arubaito-logo-transparent.png";
import {
  quizPairs,
  shuffleArray,
  scoreAnswer,
  PASS_THRESHOLD,
  TIMER_SECONDS,
  TOTAL_QUESTIONS,
  type QuizPair,
  type BookOption,
} from "@/data/nsQuizData";

// ── Device Fingerprint ──────────────────────────────────────────────
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() ?? "unknown",
  ];

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillText("fingerprint", 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {}

  const raw = components.join("|");
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Timer Hook ──────────────────────────────────────────────────────
function useTimer(seconds: number, onExpire: () => void, active: boolean, resetKey: number) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const remainingRef = useRef(seconds);

  useEffect(() => {
    if (!active) return;
    remainingRef.current = seconds;
    setRemaining(seconds);
    const interval = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);
      if (remainingRef.current <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, active, resetKey]);

  return remaining;
}

// ── Bitcoin Genesis Block Hex ───────────────────────────────────────
const GENESIS_HEX = [
  "00000000  01 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  ................",
  "00000010  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  ................",
  "00000020  00 00 00 00 3B A3 ED FD  7A 7B 12 B2 7A C7 2C 3E  ....;£íýz{.²zÇ,>",
  "00000030  67 76 8F 61 7F C8 1B C3  88 8A 51 32 3A 9F B8 AA  gv.a.È.Ã..Q2:..ª",
  "00000040  4B 1E 5E 4A 29 AB 5F 49  FF FF 00 1D 1D AC 2B 7C  K.^J)«_Iÿÿ...¬+|",
  "00000050  01 01 00 00 00 01 00 00  00 00 00 00 00 00 00 00  ................",
  "00000060  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  ................",
  "00000070  00 00 00 00 00 00 00 00  00 00 00 00 00 00 1D 00  ................",
  "00000080  01 04 45 54 68 65 20 54  69 6D 65 73 20 30 33 2F  ..EThe Times 03/",
  "00000090  4A 61 6E 2F 32 30 30 39  20 43 68 61 6E 63 65 6C  Jan/2009 Chancel",
  "000000A0  6C 6F 72 20 6F 6E 20 62  72 69 6E 6B 20 6F 66 20  lor on brink of ",
  "000000B0  73 65 63 6F 6E 64 20 62  61 69 6C 6F 75 74 20 66  second bailout f",
  "000000C0  6F 72 20 62 61 6E 6B 73  FF FF FF FF 01 00 F2 05  or banksÿÿÿÿ..ò.",
  "000000D0  2A 01 00 00 00 43 41 04  67 8A FD B0 FE 55 48 27  *....CA.g..°þUH'",
  "000000E0  19 67 F1 A6 71 30 B7 10  5C D6 A8 28 E0 39 09 A6  .gñ¦q0·.\\Ö¨(à9.¦",
  "000000F0  79 62 E0 EA 1F 61 DE B6  49 F6 BC 3F 4C EF 38 C4  ybàê.aÞ¶Iö¼?Lï8Ä",
  "00000100  F3 55 04 E5 1E C1 12 DE  5C 38 4D F7 BA 0B 8D 57  óU.å.Á.Þ\\8M÷º..W",
  "00000110  8A 4C 70 2B 6B F1 1D 5F  AC 00 00 00 00           .Lp+kñ._¬.....",
];

// ── Types ───────────────────────────────────────────────────────────
type Phase = "loading" | "blocked" | "intro" | "signup" | "quiz" | "results";

interface Answer {
  pairId: number;
  chosenTitle: string;
  score: number;
}

// ── Main Component ──────────────────────────────────────────────────
export default function NetworkSchool() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("loading");
  const [fingerprint, setFingerprint] = useState("");

  // Quiz state
  const [pairs, setPairs] = useState<QuizPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timerKey, setTimerKey] = useState(0);

  // Results state
  const [totalScore, setTotalScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [wallet, setWallet] = useState("");
  const [walletSubmitted, setWalletSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Init: generate fingerprint & check for prior attempt ──
  useEffect(() => {
    (async () => {
      const fp = await generateFingerprint();
      setFingerprint(fp);

      const { data } = await supabase
        .from("ns_quiz_attempts")
        .select("id, passed, score")
        .eq("device_fingerprint", fp)
        .limit(1);

      if (data && data.length > 0) {
        setPhase("blocked");
      } else {
        setPhase("intro");
      }
    })();
  }, []);

  // ── Start quiz ──
  const startQuiz = useCallback(() => {
    const shuffled = shuffleArray(quizPairs);
    const randomised = shuffled.map((pair) => {
      if (Math.random() > 0.5) {
        return { ...pair, bookA: pair.bookB, bookB: pair.bookA };
      }
      return pair;
    });
    setPairs(randomised);
    setCurrentIndex(0);
    setAnswers([]);
    setTimerKey((k) => k + 1);
    setPhase("quiz");
  }, []);

  // ── Handle book selection ──
  const handleSelect = useCallback(
    (book: BookOption, pair: QuizPair) => {
      const s = scoreAnswer(book);
      const answer: Answer = {
        pairId: pair.id,
        chosenTitle: book.title,
        score: s,
      };
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (currentIndex + 1 >= TOTAL_QUESTIONS) {
        finishQuiz(newAnswers);
      } else {
        setCurrentIndex((i) => i + 1);
        setTimerKey((k) => k + 1);
      }
    },
    [answers, currentIndex]
  );

  // ── Timer expired → score 0 for this question, move on ──
  const handleTimerExpire = useCallback(() => {
    if (phase !== "quiz" || currentIndex >= pairs.length) return;
    const pair = pairs[currentIndex];
    const answer: Answer = {
      pairId: pair.id,
      chosenTitle: "(timed out)",
      score: 0,
    };
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      finishQuiz(newAnswers);
    } else {
      setCurrentIndex((i) => i + 1);
      setTimerKey((k) => k + 1);
    }
  }, [phase, currentIndex, pairs, answers]);

  // ── Finish & submit ──
  const finishQuiz = async (finalAnswers: Answer[]) => {
    const score = finalAnswers.reduce((sum, a) => sum + a.score, 0);
    const didPass = score >= PASS_THRESHOLD;
    setTotalScore(score);
    setPassed(didPass);
    setPhase("results");

    await supabase.from("ns_quiz_attempts").insert({
      device_fingerprint: fingerprint,
      score,
      answers: finalAnswers as any,
      passed: didPass,
    });
  };

  // ── Submit wallet ──
  const submitWallet = async () => {
    if (!wallet.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("ns_quiz_attempts")
      .update({ solana_wallet: wallet.trim() })
      .eq("device_fingerprint", fingerprint)
      .eq("passed", true);

    if (error) {
      toast({ title: "Error", description: "Failed to save wallet.", variant: "destructive" });
    } else {
      setWalletSubmitted(true);
      toast({ title: "Wallet saved", description: "You're entered in the raffle." });
    }
    setSubmitting(false);
  };

  // ── Timer for active question ──
  const timerRemaining = useTimer(
    TIMER_SECONDS,
    handleTimerExpire,
    phase === "quiz",
    timerKey
  );

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Render ────────────────────────────────────────────────────────
  const currentPair = pairs[currentIndex];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#c8c8c8",
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
        color: "#1a1a1a",
      }}
    >
      {/* ── LOADING ── */}
      {phase === "loading" && (
        <div className="text-center animate-pulse">
          <p className="text-sm tracking-wider">initializing...</p>
        </div>
      )}

      {/* ── BLOCKED ── */}
      {phase === "blocked" && (
        <div className="text-center max-w-md space-y-6 px-6">
          <h2 className="text-lg font-bold tracking-wide">
            already attempted
          </h2>
          <p className="text-sm opacity-60">
            this device has already been used to take the alignment test.
            only one attempt is permitted per device.
          </p>
        </div>
      )}

      {/* ── INTRO (Flow Part 1) ── */}
      {phase === "intro" && (
        <div className="flex flex-col items-center text-center px-6 space-y-10">
          <h2
            className="text-xl md:text-2xl font-bold tracking-wide"
            style={{ color: "#ed565a" }}
          >
            now accepting NS members
          </h2>

          <div className="flex flex-col items-center space-y-2">
            <img
              src={arubaitoLogo}
              alt="Arubaito"
              className="w-20 h-20 md:w-24 md:h-24 object-contain"
            />
            <span className="text-xs tracking-[0.3em] uppercase">
              ARUBAITO
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold">
              private members network club for
            </p>
            <p className="text-sm">
              <span className="inline-block w-2.5 h-2.5 bg-[#1a1a1a] rounded-full mr-1.5 align-middle" />
              ex-bluechips
              <span className="inline-block w-2.5 h-2.5 bg-[#1a1a1a] rounded-full mx-1.5 align-middle" />
              changemakers
            </p>
          </div>

          <div className="space-y-3 flex flex-col items-center">
            <div className="text-center space-y-0.5">
              <p className="text-sm font-bold">take proof of NS test</p>
              <p className="text-xs opacity-60">(1 min/p question)</p>
            </div>
            <button
              onClick={startQuiz}
              className="px-10 py-3 text-sm tracking-wide text-[#faf1e1] rounded-full transition-opacity hover:opacity-80 active:scale-[0.97]"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              start test
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ (Flow Part 3) ── */}
      {phase === "quiz" && currentPair && (
        <div className="w-full max-w-4xl px-4 md:px-8 py-6 space-y-6" key={timerKey}>
          {/* Progress bar + timer */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-[#999] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 linear"
                style={{
                  width: `${(timerRemaining / TIMER_SECONDS) * 100}%`,
                  backgroundColor: timerRemaining <= 10 ? "#ed565a" : "#1a1a1a",
                }}
              />
            </div>
            <span
              className="text-sm font-bold tabular-nums min-w-[3rem] text-right"
              style={{ color: timerRemaining <= 10 ? "#ed565a" : "#1a1a1a" }}
            >
              {formatTime(timerRemaining)}
            </span>
          </div>

          {/* Two-column book cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <BookCard book={currentPair.bookA} label="A" />
            <BookCard book={currentPair.bookB} label="B" />
          </div>

          {/* A or B buttons */}
          <div className="flex items-center justify-center gap-4 md:gap-6 pt-2">
            <button
              onClick={() => handleSelect(currentPair.bookA, currentPair)}
              className="px-12 md:px-16 py-3 text-lg font-bold text-[#faf1e1] rounded-sm transition-opacity hover:opacity-80 active:scale-[0.97]"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              A
            </button>
            <span className="text-lg font-bold opacity-50">or</span>
            <button
              onClick={() => handleSelect(currentPair.bookB, currentPair)}
              className="px-12 md:px-16 py-3 text-lg font-bold text-[#faf1e1] rounded-sm transition-opacity hover:opacity-80 active:scale-[0.97]"
              style={{ backgroundColor: "#1a1a1a" }}
            >
              B
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === "results" && (
        <div className="max-w-md text-center space-y-8 px-6">
          <h2 className="text-2xl font-bold tracking-wide">
            {passed ? "aligned" : "not aligned"}
          </h2>

          <div className="space-y-2">
            <p className="text-4xl font-bold tabular-nums">
              {totalScore} / {TOTAL_QUESTIONS}
            </p>
            <p className="text-xs opacity-60">
              pass threshold: {PASS_THRESHOLD} points
            </p>
          </div>

          {passed ? (
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                congratulations. you may optionally enter a solana wallet
                address for the raffle.
              </p>

              {!walletSubmitted ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="solana wallet address..."
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="text-xs border-[#1a1a1a] bg-transparent"
                    style={{ fontFamily: "inherit" }}
                  />
                  <button
                    onClick={submitWallet}
                    disabled={submitting || !wallet.trim()}
                    className="px-6 py-2 text-xs text-[#faf1e1] rounded-sm disabled:opacity-40"
                    style={{ backgroundColor: "#1a1a1a" }}
                  >
                    {submitting ? "..." : "submit"}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-bold" style={{ color: "#ed565a" }}>
                  wallet registered for raffle
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm opacity-70">
              your worldview did not sufficiently align with the network
              school philosophy. this device cannot retake the test.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Book Card ───────────────────────────────────────────────────────
function BookCard({ book, label }: { book: BookOption; label: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      {/* Description */}
      <div className="space-y-1">
        <p className="text-xs font-bold">{book.title}</p>
        <p className="text-xs opacity-60 leading-relaxed max-w-xs">
          {book.description || `${book.title} by ${book.author}`}
        </p>
      </div>

      {/* Cover */}
      <div className="w-48 md:w-56 aspect-[2/3] bg-white/50 flex items-center justify-center overflow-hidden shadow-md">
        {!imgError ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <span className="text-2xl mb-1">📖</span>
            <span className="text-[10px] opacity-60">{book.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
