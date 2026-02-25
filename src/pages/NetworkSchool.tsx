import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import arubaitoLogo from "@/assets/arubaito-deck-logo.png";
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

interface TwitterUser {
  x_user_id: string;
  handle: string;
  display_name: string;
  profile_image_url?: string;
}

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

  // Twitter auth state
  const [twitterUser, setTwitterUser] = useState<TwitterUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  // ── Init: generate fingerprint, check prior attempt, handle OAuth callback ──
  useEffect(() => {
    (async () => {
      const fp = await generateFingerprint();
      setFingerprint(fp);

      // Handle Twitter OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const codeVerifier = sessionStorage.getItem("ns_twitter_code_verifier");

      if (code && codeVerifier) {
        setIsAuthenticating(true);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
        sessionStorage.removeItem("ns_twitter_code_verifier");

        try {
          const { data, error } = await supabase.functions.invoke("twitter-oauth", {
            body: {
              action: "exchangeToken",
              code,
              redirectUri: `${window.location.origin}/ns`,
              codeVerifier,
              skipWhitelistCheck: true,
            },
          });

          if (error || !data?.user) {
            throw new Error(error?.message || "Failed to authenticate with X");
          }

          setTwitterUser(data.user);
          setIsAuthenticating(false);

          // Check fingerprint after successful auth
          const { data: attemptData } = await supabase
            .from("ns_quiz_attempts")
            .select("id, passed, score")
            .eq("device_fingerprint", fp)
            .limit(1);

          if (attemptData && attemptData.length > 0) {
            setPhase("blocked");
          } else {
            setPhase("intro");
          }
        } catch (err: any) {
          toast({
            title: "Authentication failed",
            description: err.message || "Could not verify your X account.",
            variant: "destructive",
          });
          setIsAuthenticating(false);
          setPhase("intro");
        }
        return;
      }

      // Normal load — check fingerprint
      const { data: attemptData } = await supabase
        .from("ns_quiz_attempts")
        .select("id, passed, score")
        .eq("device_fingerprint", fp)
        .limit(1);

      if (attemptData && attemptData.length > 0) {
        setPhase("blocked");
      } else {
        setPhase("intro");
      }
    })();
  }, []);

  // ── Twitter login ──
  const handleTwitterLogin = async () => {
    setIsAuthenticating(true);
    try {
      const redirectUri = `${window.location.origin}/ns`;
      const { data, error } = await supabase.functions.invoke("twitter-oauth", {
        body: { action: "getAuthUrl", redirectUri },
      });

      if (error || !data?.authUrl) {
        throw new Error("Failed to get auth URL");
      }

      sessionStorage.setItem("ns_twitter_code_verifier", data.codeVerifier);
      window.location.href = data.authUrl;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not start X authentication.",
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  };

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
      x_user_id: twitterUser?.x_user_id || null,
      twitter_handle: twitterUser?.handle || null,
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
      {(phase === "loading" || isAuthenticating) && (
        <div className="text-center animate-pulse">
          <p className="text-sm tracking-wider">
            {isAuthenticating ? "authenticating..." : "initializing..."}
          </p>
        </div>
      )}

      {/* ── BLOCKED ── */}
      {phase === "blocked" && !isAuthenticating && (
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

      {/* ── INTRO ── */}
      {phase === "intro" && !isAuthenticating && (
        <div className="flex flex-col items-center text-center px-6 space-y-10">
          <h2
            className="text-xl md:text-2xl font-bold tracking-wide"
            style={{ color: "#ed565a" }}
          >
            now accepting NS members
          </h2>

          <img
            src={arubaitoLogo}
            alt="Arubaito"
            className="w-32 md:w-40 object-contain"
          />

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

            {/* Show twitter user if authenticated, otherwise show login button */}
            {twitterUser ? (
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex items-center gap-2 text-sm">
                  {twitterUser.profile_image_url && (
                    <img
                      src={twitterUser.profile_image_url}
                      alt={twitterUser.handle}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="font-bold">@{twitterUser.handle}</span>
                </div>
                <button
                  onClick={startQuiz}
                  className="px-10 py-3 text-sm tracking-wide text-[#faf1e1] rounded-full transition-opacity hover:opacity-80 active:scale-[0.97]"
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  start test
                </button>
              </div>
            ) : (
              <button
                onClick={handleTwitterLogin}
                disabled={isAuthenticating}
                className="px-10 py-3 text-sm tracking-wide text-[#faf1e1] rounded-full transition-opacity hover:opacity-80 active:scale-[0.97] disabled:opacity-40"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                sign in with X to start
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {phase === "quiz" && currentPair && !isAuthenticating && (
        <div className="w-full max-w-4xl px-4 md:px-8 py-6 space-y-6" key={timerKey}>
          {/* Progress bar + timer + question counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold opacity-60">
                question {currentIndex + 1} of {TOTAL_QUESTIONS}
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: timerRemaining <= 10 ? "#ed565a" : "#1a1a1a" }}
              >
                {formatTime(timerRemaining)}
              </span>
            </div>
            <div className="flex-1 h-3 bg-[#999] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 linear"
                style={{
                  width: `${(timerRemaining / TIMER_SECONDS) * 100}%`,
                  backgroundColor: timerRemaining <= 10 ? "#ed565a" : "#1a1a1a",
                }}
              />
            </div>
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
      {phase === "results" && !isAuthenticating && (
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
