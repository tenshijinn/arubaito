import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import PaymentModal from "./PaymentModal";
import JobCard from "./JobCard";
import TalentCard from "./TalentCard";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

interface ReiChatbotProps {
  walletAddress: string;
  userMode: 'talent' | 'employer';
}

const ReiChatbot = ({ walletAddress, userMode }: ReiChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history
    loadConversation();
  }, [walletAddress]);

  // Reset conversation when mode changes
  useEffect(() => {
    const resetConversation = async () => {
      if (conversationId) {
        // Delete all messages from the database for this conversation
        try {
          await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);
        } catch (error) {
          console.error('Error deleting conversation messages:', error);
        }
        
        // Clear local state
        setMessages([]);
        setConversationId(null);
      }
    };
    
    resetConversation();
  }, [userMode]);

  const loadConversation = async () => {
    try {
      const { data: conversation } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (conversation) {
        setConversationId(conversation.id);

        const { data: messages } = await supabase
          .from('chat_messages')
          .select('role, content, metadata')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (messages) {
          setMessages(messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
            metadata: m.metadata
          })));
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rei-chat', {
        body: {
          message: input,
          walletAddress,
          conversationId: conversationId || undefined,
          userMode
        }
      });

      if (error) throw error;

      // Check if response contains action metadata
      let metadata = null;
      let cleanContent = data.response;
      
      // Extract JSON metadata from response if present
      const jsonMatch = data.response.match(/\{"action":"[^"]+","link":"[^"]+"\}/);
      if (jsonMatch) {
        try {
          metadata = JSON.parse(jsonMatch[0]);
          cleanContent = data.response.replace(jsonMatch[0], '').trim();
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanContent,
        metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Check if response contains payment request
      if (data.response.includes('payment_required') || data.response.includes('$5')) {
        // Parse payment request from response
        try {
          const match = data.response.match(/\{.*"payment_required".*\}/);
          if (match) {
            setPaymentRequest(JSON.parse(match[0]));
          }
        } catch (e) {
          console.error('Failed to parse payment request:', e);
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (signature: string) => {
    setPaymentRequest(null);
    
    // Send payment verification message
    const verificationMessage = `I've completed the payment. Transaction signature: ${signature}`;
    setMessages(prev => [...prev, { role: 'user', content: verificationMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rei-chat', {
        body: {
          message: verificationMessage,
          walletAddress,
          conversationId: conversationId || undefined,
          userMode
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
    const username = isUser ? '@username' : '@Rei';
    
    return (
      <div key={index} className="mb-6 font-mono">
        <div className="flex gap-3 text-sm">
          <span className="text-muted-foreground">[{timestamp}]</span>
          <span style={{ color: isUser ? '#f1eee6' : '#e565a0' }}>
            {username}
          </span>
          <div className="flex-1 whitespace-pre-wrap break-words" style={{ color: isUser ? '#f1eee6' : '#e565a0' }}>
            {message.content}
          </div>
        </div>
        
        {/* Render action button if metadata contains link */}
        {!isUser && message.metadata?.action === 'register' && message.metadata?.link && (
          <div className="mt-3 ml-[120px]">
            <Button 
              onClick={() => window.location.href = message.metadata.link}
              variant="outline"
              className="text-sm"
            >
              Complete Registration
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-full">
      {/* Messages area */}
      <div className="h-full overflow-y-auto px-8 py-12 pb-32 max-w-4xl mx-auto w-full scrollbar-hide">
        {messages.length === 0 && (
          <div className="font-mono text-muted-foreground space-y-4">
            <p className="text-sm">Hi! I'm Rei, your Web3 talent assistant.</p>
            <p className="text-sm">How can I help you today?</p>
            <div className="mt-8 space-y-2 text-sm">
              <p>🎯 For Talent: "Find me jobs matching my profile"</p>
              <p>💼 For Employers: "Show me React developers with DeFi experience"</p>
              <p>📝 Post Opportunities: "I want to post a job" or "I want to post a task"</p>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => renderMessage(message, index))}
        
        {loading && (
          <div className="font-mono text-sm mb-6 flex gap-3">
            <span className="text-muted-foreground">[...]</span>
            <span className="text-primary">@Rei</span>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-muted-foreground">thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - absolute center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl px-8 z-10 pointer-events-none">
        <div className="pointer-events-auto">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={loading}
            className="w-full pr-12 h-12 rounded-full border-2 border-primary/50 bg-transparent font-mono text-sm focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentRequest && (
        <PaymentModal
          isOpen={!!paymentRequest}
          onClose={() => setPaymentRequest(null)}
          action={paymentRequest.action}
          details={paymentRequest.details}
          treasuryWallet={paymentRequest.treasury_wallet}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default ReiChatbot;