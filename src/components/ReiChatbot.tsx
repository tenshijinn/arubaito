import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import JobCard from "./JobCard";
import TalentCard from "./TalentCard";
import { PresetButton } from "./chat/PresetButton";
import { QuickActionsPanel } from "./chat/QuickActionsPanel";
import { getPresetsForMode, getWelcomePresets } from "./chat/chatPresets";
import { SolanaPayQR } from "./SolanaPayQR";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { X402Payment } from "./X402Payment";

interface Message {
  role: "user" | "assistant";
  content: string;
  metadata?: any;
  timestamp?: string;
}

interface ReiChatbotProps {
  walletAddress: string;
  userMode: "talent" | "employer";
  twitterHandle?: string;
}

const ReiChatbot = ({ walletAddress, userMode, twitterHandle }: ReiChatbotProps) => {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage on mount
    const stored = localStorage.getItem(`rei_chat_${walletAddress}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() => {
    // Load conversationId from localStorage on mount
    return localStorage.getItem(`rei_chat_id_${walletAddress}`) || null;
  });
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'solana-pay' | 'x402' | null>(null);
  const [currentPaymentData, setCurrentPaymentData] = useState<any>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [operationStatus, setOperationStatus] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const placeholders = [
    "> type command or select quick action...",
    `> try: '${getWelcomePresets(userMode)[0]}'`,
    "> try: 'check my points'",
    "> try: 'submit opportunity'",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cycle through placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [userMode]);

  // Save messages and conversationId to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`rei_chat_${walletAddress}`, JSON.stringify(messages));
    }
  }, [messages, walletAddress]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(`rei_chat_id_${walletAddress}`, conversationId);
    }
  }, [conversationId, walletAddress]);

  // Load conversation on mount and when wallet changes
  useEffect(() => {
    // Only load from database if we don't have localStorage data
    if (messages.length === 0) {
      loadConversation();
    }
  }, []); // Only run once on mount

  // Track previous userMode to detect actual changes
  const prevUserModeRef = useRef(userMode);

  // Only reset conversation when mode actually changes (not on initial mount)
  useEffect(() => {
    const resetConversation = async () => {
      // Only reset if userMode actually changed (not initial mount)
      if (prevUserModeRef.current !== undefined && prevUserModeRef.current !== userMode) {
        console.log("User mode changed, resetting conversation");
        if (conversationId) {
          // Delete all messages from the database for this conversation
          try {
            await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
          } catch (error) {
            console.error("Error deleting conversation messages:", error);
          }

          // Clear local state and localStorage
          setMessages([]);
          setConversationId(null);
          localStorage.removeItem(`rei_chat_${walletAddress}`);
          localStorage.removeItem(`rei_chat_id_${walletAddress}`);
        }
      }
      prevUserModeRef.current = userMode;
    };

    resetConversation();
  }, [userMode, walletAddress]); // Only depend on userMode, not conversationId

  const loadConversation = async () => {
    try {
      const { data: conversation } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single();

      if (conversation) {
        setConversationId(conversation.id);

        const { data: messages } = await supabase
          .from("chat_messages")
          .select("role, content, metadata")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (messages) {
          setMessages(
            messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              metadata: m.metadata,
            })),
          );
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handlePaymentComplete = async (reference: string) => {
    // Reset payment UI state
    setShowPaymentMethod(false);
    setSelectedPaymentMethod(null);
    setCurrentPaymentData(null);
    
    // Send confirmation to AI by setting input and triggering send
    const confirmMessage = `Payment completed with reference: ${reference}`;
    setMessages((prev) => [...prev, { role: "user", content: confirmMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("rei-chat", {
        body: {
          message: confirmMessage,
          walletAddress,
          conversationId: conversationId || undefined,
          userMode,
        },
      });

      if (error) throw error;

      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        metadata: data.metadata,
        timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method: 'solana-pay' | 'x402') => {
    setSelectedPaymentMethod(method);
    setShowPaymentMethod(false);
  };

  const handleCancelPayment = () => {
    setShowPaymentMethod(false);
    setSelectedPaymentMethod(null);
    setCurrentPaymentData(null);
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear the chat? This cannot be undone.")) {
      return;
    }

    try {
      // Delete from database if conversation exists
      if (conversationId) {
        await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
      }

      // Clear local state and localStorage
      setMessages([]);
      setConversationId(null);
      localStorage.removeItem(`rei_chat_${walletAddress}`);
      localStorage.removeItem(`rei_chat_id_${walletAddress}`);

      toast({
        title: "Chat Cleared",
        description: "Your conversation has been reset.",
      });
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePresetSelect = (preset: string) => {
    setInput(preset);
    setShowQuickActions(false);
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      inputElement?.focus();
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const userMessage: Message = { role: "user", content: input, timestamp };
    setMessages((prev) => [...prev, userMessage]);
    
    // Detect operation type for status messages
    const isPostOperation = /post|submit|create|add.*job|add.*task|add.*gig/i.test(input);
    
    setInput("");
    setLoading(true);
    
    // Progressive status updates
    const statusTimers: NodeJS.Timeout[] = [];
    
    if (isPostOperation) {
      setOperationStatus("Rei is thinking...");
      statusTimers.push(setTimeout(() => setOperationStatus("Processing your request..."), 3000));
      statusTimers.push(setTimeout(() => setOperationStatus("Generating payment details..."), 10000));
      statusTimers.push(setTimeout(() => setOperationStatus("Fetching current SOL price..."), 25000));
      statusTimers.push(setTimeout(() => setOperationStatus("Almost there, finalizing..."), 40000));
      statusTimers.push(setTimeout(() => setOperationStatus("Still working on it, please wait..."), 60000));
    } else {
      setOperationStatus("Rei is thinking...");
      statusTimers.push(setTimeout(() => setOperationStatus("Processing your request..."), 5000));
    }

    try {
      // Add 60 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 60000),
      );

      const invokePromise = supabase.functions.invoke("rei-chat", {
        body: {
          message: input,
          walletAddress,
          conversationId: conversationId || undefined,
          userMode,
        },
      });

      const { data, error } = (await Promise.race([invokePromise, timeoutPromise])) as any;

      if (error) throw error;

      // Check if response contains action or solanaPay metadata
      let metadata = data.metadata || null;
      let cleanContent = data.response;

      // Extract JSON metadata from response if present
      const jsonMatch = data.response.match(/\{"action":"[^"]+","link":"[^"]+"\}/);
      if (jsonMatch) {
        try {
          const actionMetadata = JSON.parse(jsonMatch[0]);
          metadata = { ...metadata, ...actionMetadata };
          cleanContent = data.response.replace(jsonMatch[0], "").trim();
        } catch (e) {
          console.error("Failed to parse metadata:", e);
        }
      }

      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: cleanContent,
        metadata,
        timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error.message === "Request timed out" 
          ? "Request took too long. Please try again."
          : error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setOperationStatus("");
      // Clear all status timers
      statusTimers.forEach(timer => clearTimeout(timer));
    }
  };

  const [displayedContent, setDisplayedContent] = useState<Record<number, string>>(() => {
    // Initialize with all loaded messages already fully displayed
    const stored = localStorage.getItem(`rei_chat_${walletAddress}`);
    if (stored) {
      const loadedMessages = JSON.parse(stored);
      const initial: Record<number, string> = {};
      loadedMessages.forEach((msg: Message, idx: number) => {
        if (msg.role === "assistant") {
          initial[idx] = msg.content; // Show full content immediately for loaded messages
        }
      });
      return initial;
    }
    return {};
  });
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Typewriter effect for NEW AI messages only
  useEffect(() => {
    // Only apply typewriter to newly added messages
    if (messages.length <= lastMessageCount) {
      setLastMessageCount(messages.length);
      return;
    }

    const intervals: NodeJS.Timeout[] = [];
    const newMessageIndex = messages.length - 1;
    const newMessage = messages[newMessageIndex];

    if (newMessage.role === "assistant" && !displayedContent[newMessageIndex]) {
      const content = newMessage.content;
      let currentIndex = 0;

      const intervalId = setInterval(() => {
        if (currentIndex <= content.length) {
          setDisplayedContent((prev) => ({
            ...prev,
            [newMessageIndex]: content.substring(0, currentIndex),
          }));
          currentIndex++;
        } else {
          clearInterval(intervalId);
        }
      }, 15); // 15ms per character for smooth typewriter
      intervals.push(intervalId);
    }

    setLastMessageCount(messages.length);

    return () => {
      intervals.forEach((i) => clearInterval(i));
    };
  }, [messages.length]); // Only trigger when message count changes

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const timestamp =
      message.timestamp ||
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    const username = isUser ? `@${twitterHandle || "user"}` : "@Rei";
    const content = isUser ? message.content : displayedContent[index] || "";
    const isTyping = !isUser && content.length < message.content.length;

    return (
      <div key={index} className="mb-6 font-mono">
        <div className="flex gap-3 text-sm">
          <span className="text-muted-foreground">[{timestamp}]</span>
          <span style={{ color: isUser ? "#f1eee6" : "#e565a0" }}>{username}</span>
          <div className="flex-1 whitespace-pre-wrap break-words" style={{ color: isUser ? "#f1eee6" : "#e565a0" }}>
            {content}
            {isTyping && <span className="animate-pulse">▋</span>}
          </div>
        </div>

        {/* Render action button if metadata contains link */}
        {!isUser && message.metadata?.action === "register" && message.metadata?.link && (
          <div className="mt-3 ml-[120px]">
            <Button
              onClick={() => (window.location.href = message.metadata.link)}
              variant="outline"
              className="text-sm"
            >
              Complete Registration
            </Button>
          </div>
        )}

        {/* Render Solana Pay QR code if metadata contains solanaPay */}
        {!isUser && message.metadata?.solanaPay && (
          <div className="mt-3 ml-[120px]">
            {!publicKey && !selectedPaymentMethod && !showPaymentMethod && (
              <div className="space-y-3 p-4 border border-primary/30 bg-background/50 rounded font-mono text-sm">
                <p className="text-muted-foreground">Connect wallet to choose payment method:</p>
                <WalletMultiButton className="!bg-primary hover:!bg-primary/90 w-full" />
              </div>
            )}
            
            {publicKey && !selectedPaymentMethod && !showPaymentMethod && (
              <button
                onClick={() => {
                  setCurrentPaymentData(message.metadata.solanaPay);
                  setShowPaymentMethod(true);
                }}
                className="text-sm text-primary hover:underline font-mono"
              >
                [Choose Payment Method]
              </button>
            )}
            
            {showPaymentMethod && currentPaymentData === message.metadata.solanaPay && (
              <PaymentMethodSelector
                onMethodSelect={handlePaymentMethodSelect}
                amount={message.metadata.solanaPay.amount}
                solAmount={message.metadata.solanaPay.solAmount}
              />
            )}
            
            {selectedPaymentMethod === 'solana-pay' && currentPaymentData === message.metadata.solanaPay && (
              <SolanaPayQR
                qrCodeUrl={message.metadata.solanaPay.qrCodeUrl}
                reference={message.metadata.solanaPay.reference}
                paymentUrl={message.metadata.solanaPay.paymentUrl}
                amount={message.metadata.solanaPay.amount}
                recipient={message.metadata.solanaPay.recipient}
                walletAddress={walletAddress}
                onPaymentComplete={handlePaymentComplete}
              />
            )}
            
            {selectedPaymentMethod === 'x402' && currentPaymentData === message.metadata.solanaPay && (
              <X402Payment
                amount={message.metadata.solanaPay.amount}
                memo={message.metadata.solanaPay.memo || ''}
                onSuccess={handlePaymentComplete}
                onCancel={handleCancelPayment}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 pb-32 max-w-4xl mx-auto w-full scrollbar-hide">
        {messages.length === 0 && (
          <div className="font-mono space-y-4">
            <p className="text-sm text-muted-foreground">Hi! I'm Rei, your Web3 talent assistant.</p>
            <p className="text-sm text-muted-foreground mb-6">Try one of these commands:</p>

            <div className="space-y-2">
              {getWelcomePresets(userMode).map((preset, idx) => (
                <PresetButton key={idx} text={preset} onClick={() => handlePresetSelect(preset)} />
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => renderMessage(message, index))}

        {loading && (
          <div className="font-mono text-sm mb-6 space-y-2">
            <div className="flex gap-3">
              <span className="text-muted-foreground">[...]</span>
              <span className="text-primary">@Rei</span>
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">thinking...</span>
              </div>
            </div>
            {operationStatus && (
              <div className="ml-[120px] text-xs text-muted-foreground animate-pulse">
                {operationStatus}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-primary/20 z-10">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="text-xs font-mono text-muted-foreground 
                       hover:text-primary transition-colors"
            >
              [?]
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-xs font-mono text-muted-foreground 
                         hover:text-destructive transition-colors ml-auto"
              >
                [clear chat]
              </button>
            )}
          </div>
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={placeholders[placeholderIndex]}
              disabled={loading}
              className="w-full pr-12 h-12 rounded-full border-2 border-primary/50 bg-transparent font-mono text-sm focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        categories={getPresetsForMode(userMode)}
        onSelect={handlePresetSelect}
      />
    </div>
  );
};

export default ReiChatbot;
