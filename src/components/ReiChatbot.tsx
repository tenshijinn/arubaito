import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
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
    if (conversationId) {
      setMessages([]);
      setConversationId(null);
    }
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

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
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
    
    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <Card className={`max-w-[80%] p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Render special components based on content */}
          {!isUser && message.content.includes('"type": "job"') && (
            <div className="mt-4">
              {/* Parse and render JobCard components */}
            </div>
          )}
          
          {!isUser && message.content.includes('"matchScore"') && (
            <div className="mt-4">
              {/* Parse and render TalentCard components */}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-card rounded-lg border border-border overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg mb-2">Hi! I'm Rei, your Web3 talent assistant.</p>
            <p className="text-sm">How can I help you today?</p>
            <div className="mt-6 space-y-2 text-sm">
              <p>🎯 <strong>For Talent:</strong> "Find me jobs matching my profile"</p>
              <p>💼 <strong>For Employers:</strong> "Show me React developers with DeFi experience"</p>
              <p>📝 <strong>Post Opportunities:</strong> "I want to post a job" or "I want to post a task"</p>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => renderMessage(message, index))}
        
        {loading && (
          <div className="flex justify-start mb-4">
            <Card className="bg-muted p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Rei is thinking...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
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