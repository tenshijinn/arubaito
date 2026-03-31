import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BlockClockState = "countdown" | "open" | "closed";

interface BlockClockData {
  state: BlockClockState;
  timeRemaining: number; // seconds
  blocksRemaining: number;
  currentBlock: number;
  targetBlock: number;
  progress: number; // 0-100
  loading: boolean;
  signupWindowRemaining: number; // seconds remaining in open window
}

const BLOCK_TIME_MS = 400;
const POLL_INTERVAL_MS = 60_000;

export const useBlockClock = (): BlockClockData => {
  // Debug override via ?debugBlockClock=open|closed|countdown
  const debugState = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('debugBlockClock') as BlockClockState | null
    : null;

  const [data, setData] = useState<BlockClockData>({
    state: "countdown",
    timeRemaining: 0,
    blocksRemaining: 0,
    currentBlock: 0,
    targetBlock: 0,
    progress: 0,
    loading: true,
    signupWindowRemaining: 0,
  });

  const configRef = useRef<any>(null);

  const fetchBlockClock = useCallback(async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke("check-block-clock");
      if (error) throw error;

      configRef.current = result;
      updateState(result);
    } catch (e) {
      console.error("Block clock fetch error:", e);
      // Try fallback from DB
      try {
        const { data: config } = await supabase
          .from("block_clock_config" as any)
          .select("*")
          .eq("id", 1)
          .single();

        if (config) {
          const c = config as any;
          const elapsedMs = Date.now() - new Date(c.start_timestamp).getTime();
          const estimatedCurrentBlock = Number(c.start_block) + Math.floor(elapsedMs / BLOCK_TIME_MS);
          const targetBlock = Number(c.start_block) + Number(c.target_blocks);

          updateState({
            currentBlock: estimatedCurrentBlock,
            targetBlock,
            startBlock: Number(c.start_block),
            targetBlocks: Number(c.target_blocks),
            isUnlocked: c.is_unlocked,
            unlockedAt: c.unlocked_at,
            signupWindowMinutes: c.signup_window_minutes,
            isOpen: false,
          });
        }
      } catch {
        // silent
      }
    }
  }, []);

  const updateState = useCallback((result: any) => {
    const blocksRemaining = Math.max(0, result.targetBlock - result.currentBlock);
    const timeRemaining = Math.max(0, Math.floor((blocksRemaining * BLOCK_TIME_MS) / 1000));
    const totalBlocks = result.targetBlocks || 1;
    const elapsed = result.currentBlock - result.startBlock;
    const progress = Math.min(100, Math.max(0, (elapsed / totalBlocks) * 100));

    let state: BlockClockState = "countdown";
    let signupWindowRemaining = 0;

    if (result.isUnlocked && result.unlockedAt) {
      const unlockTime = new Date(result.unlockedAt).getTime();
      const windowEnd = unlockTime + (result.signupWindowMinutes || 60) * 60 * 1000;
      const remaining = Math.floor((windowEnd - Date.now()) / 1000);

      if (remaining > 0) {
        state = "open";
        signupWindowRemaining = remaining;
      } else {
        state = "closed";
      }
    } else if (blocksRemaining <= 0) {
      state = "countdown"; // target reached but not yet confirmed by backend
    }

    setData({
      state,
      timeRemaining,
      blocksRemaining,
      currentBlock: result.currentBlock,
      targetBlock: result.targetBlock,
      progress,
      loading: false,
      signupWindowRemaining,
    });
  }, []);

  // Tick down every second for smooth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        if (prev.loading) return prev;

        if (prev.state === "countdown" && prev.timeRemaining > 0) {
          const newTime = prev.timeRemaining - 1;
          const newBlocks = Math.max(0, Math.ceil((newTime * 1000) / BLOCK_TIME_MS));
          return { ...prev, timeRemaining: newTime, blocksRemaining: newBlocks };
        }

        if (prev.state === "open" && prev.signupWindowRemaining > 0) {
          const newRemaining = prev.signupWindowRemaining - 1;
          if (newRemaining <= 0) return { ...prev, state: "closed", signupWindowRemaining: 0 };
          return { ...prev, signupWindowRemaining: newRemaining };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Poll edge function
  useEffect(() => {
    fetchBlockClock();
    const interval = setInterval(fetchBlockClock, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchBlockClock]);

  if (debugState && ['countdown', 'open', 'closed'].includes(debugState)) {
    return {
      ...data,
      state: debugState,
      loading: false,
      signupWindowRemaining: debugState === 'open' ? 3540 : 0,
      progress: debugState === 'countdown' ? data.progress : 100,
    };
  }

  return data;
};
