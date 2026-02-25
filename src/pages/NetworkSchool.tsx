import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

// ── Types ───────────────────────────────────────────────────────────
type Phase = "loading" | "blocked" | "intro" | "quiz" | "results";

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
    // Also randomise which book appears left vs right
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

    // Store attempt
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

  // ── Render ────────────────────────────────────────────────────────
  const currentPair = pairs[currentIndex];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col">
      {/* Header */}
      <header className="border-b-4 border-primary p-4 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">
          Network School Alignment Test
        </h1>
        <p className="text-xs text-muted-foreground mt-1 tracking-wide">
          17 Questions · 60s Each · Choose Wisely
        </p>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        {/* ── LOADING ── */}
        {phase === "loading" && (
          <div className="text-center animate-pulse">
            <p className="text-lg tracking-wider">INITIALIZING...</p>
          </div>
        )}

        {/* ── BLOCKED ── */}
        {phase === "blocked" && (
          <div className="text-center max-w-md space-y-4">
            <div className="text-4xl">🚫</div>
            <h2 className="text-xl font-bold uppercase tracking-wider">
              Already Attempted
            </h2>
            <p className="text-muted-foreground text-sm">
              This device has already been used to take the alignment test.
              Only one attempt is permitted per device.
            </p>
          </div>
        )}

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <div className="max-w-lg text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold uppercase tracking-wider">
                Are You Aligned?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You will be shown 17 pairs of books representing different
                worldviews. For each pair, choose the book that resonates most
                with your thinking.
              </p>
            </div>

            <div className="border-2 border-primary/30 p-4 text-left space-y-2 text-xs">
              <p>
                <span className="text-primary font-bold">⏱ TIME LIMIT:</span>{" "}
                60 seconds per question
              </p>
              <p>
                <span className="text-primary font-bold">⚠ ONE ATTEMPT:</span>{" "}
                Per device — no retakes
              </p>
              <p>
                <span className="text-primary font-bold">🎯 THRESHOLD:</span>{" "}
                {PASS_THRESHOLD}+ points to pass
              </p>
              <p>
                <span className="text-primary font-bold">📖 FORMAT:</span>{" "}
                Pick the book closer to your worldview
              </p>
            </div>

            <Button onClick={startQuiz} size="lg" className="w-full">
              BEGIN TEST
            </Button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {phase === "quiz" && currentPair && (
          <div className="w-full max-w-4xl space-y-6">
            {/* Progress + Timer */}
            <div className="flex items-center justify-between text-sm">
              <span className="tracking-wider">
                QUESTION {currentIndex + 1} / {TOTAL_QUESTIONS}
              </span>
              <span
                className={`font-bold text-lg tabular-nums ${
                  timerRemaining <= 10
                    ? "text-destructive animate-pulse"
                    : "text-primary"
                }`}
              >
                {timerRemaining}s
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
                }}
              />
            </div>

            {/* Timer bar */}
            <div className="w-full h-0.5 bg-muted">
              <div
                className={`h-full transition-all duration-1000 linear ${
                  timerRemaining <= 10 ? "bg-destructive" : "bg-primary/50"
                }`}
                style={{
                  width: `${(timerRemaining / TIMER_SECONDS) * 100}%`,
                }}
              />
            </div>

            <p className="text-center text-muted-foreground text-xs uppercase tracking-widest">
              Which book resonates more with your worldview?
            </p>

            {/* Book Cards */}
            <div className="grid grid-cols-2 gap-4 md:gap-8" key={timerKey}>
              <BookCard
                book={currentPair.bookA}
                onSelect={() => handleSelect(currentPair.bookA, currentPair)}
              />
              <BookCard
                book={currentPair.bookB}
                onSelect={() => handleSelect(currentPair.bookB, currentPair)}
              />
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && (
          <div className="max-w-md text-center space-y-6">
            <div
              className={`text-6xl ${
                passed ? "animate-pulse" : ""
              }`}
            >
              {passed ? "✓" : "✗"}
            </div>

            <h2 className="text-2xl font-bold uppercase tracking-wider">
              {passed ? "ALIGNED" : "NOT ALIGNED"}
            </h2>

            <div className="border-2 border-primary/30 p-4 space-y-2">
              <p className="text-3xl font-bold tabular-nums">
                {totalScore} / {TOTAL_QUESTIONS}
              </p>
              <p className="text-xs text-muted-foreground">
                Pass threshold: {PASS_THRESHOLD} points
              </p>
            </div>

            {passed ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Congratulations. You may optionally enter a Solana wallet
                  address for the raffle.
                </p>

                {!walletSubmitted ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Solana wallet address..."
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={submitWallet}
                      disabled={submitting || !wallet.trim()}
                      size="sm"
                    >
                      {submitting ? "..." : "SUBMIT"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-primary text-sm font-bold">
                    ✓ Wallet registered for raffle
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your worldview did not sufficiently align with the Network
                School philosophy. This device cannot retake the test.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-muted p-3 text-center">
        <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
          Network School · Alignment Protocol v1
        </p>
      </footer>
    </div>
  );
}

// ── Book Card ───────────────────────────────────────────────────────
function BookCard({
  book,
  onSelect,
}: {
  book: BookOption;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onSelect}
      className="group flex flex-col items-center gap-3 p-3 md:p-4 border-2 border-muted hover:border-primary transition-all duration-200 cursor-pointer bg-background hover:bg-primary/5 active:scale-[0.98]"
    >
      <div className="w-full aspect-[2/3] bg-muted/20 flex items-center justify-center overflow-hidden">
        {!imgError ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-2">📖</span>
            <span className="text-xs text-muted-foreground">{book.title}</span>
          </div>
        )}
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs md:text-sm font-bold leading-tight">
          {book.title}
        </p>
        <p className="text-[10px] md:text-xs text-muted-foreground">
          {book.author}
        </p>
      </div>
    </button>
  );
}
