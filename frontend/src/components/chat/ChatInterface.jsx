import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trash2, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { sendChatMessage } from '../../services/plumberApi';

const DEFAULT_SUGGESTIONS = [
  "I want to buy a 3 BHK flat in Kokapet around 1800 sq ft",
  "Looking for a 2 BHK flat in Kukatpally resale 1200 sq ft",
  "4 BHK Independent House in Jubilee Hills 3200 sq ft",
  "2 BHK Rental flat in Gachibowli 1250 sq ft furnished"
];

export default function ChatInterface({ prefilledPrompt }) {
  const [sessionId, setSessionId] = useState(() => {
    return 'session_' + Math.random().toString(36).substring(2, 9);
  });

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am PropGPT, your intelligent real estate pricing companion for Hyderabad. Tell me what property you are looking to buy or rent (e.g. 'I want to buy a 3 BHK flat in Kokapet around 1800 sq ft'), and I'll extract the details, compare micro-market trends, and calculate an accurate ML valuation.",
      suggestions: DEFAULT_SUGGESTIONS,
      timestamp: 'Just now'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle prefilled prompt from Hero or outside
  useEffect(() => {
    if (prefilledPrompt) {
      handleSendMessage(prefilledPrompt);
    }
  }, [prefilledPrompt]);

  const handleSendMessage = async (text) => {
    if (!text || isLoading) return;

    const userMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(sessionId, text);

      const predictionData = response.prediction ? {
        predicted_price: response.prediction,
        prediction_type: response.intent || response.prediction_type || (response.property?.intent) || 'flat_price'
      } : null;

      const aiMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: response.reply || response.message || "I have analyzed your property request.",
        prediction: predictionData,
        property_details: response.property || response.property_details || (response.conversation_state?.required_fields) || null,
        suggestions: response.suggested_replies || response.suggestions || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.warn("Plumber chat API error:", err);

      // Never fabricate a predicted price. Return an honest error message with retry guidance.
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          role: 'assistant',
          content: "⚠️ I'm unable to connect to the PropGPT valuation backend at this moment. Please verify that the R Plumber API server is running on http://127.0.0.1:8000 and try again.",
          prediction: null,
          property_details: null,
          suggestions: [
            "Estimate price of a 2 BHK in Kukatpally 1200 sqft",
            "Try again"
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setSessionId('session_' + Math.random().toString(36).substring(2, 9));
    setMessages([
      {
        id: 'welcome_new',
        role: 'assistant',
        content: "Chat reset! How can I assist you with Hyderabad property valuations today?",
        suggestions: DEFAULT_SUGGESTIONS,
        timestamp: 'Just now'
      }
    ]);
  };

  return (
    <div style={{
      background: 'rgba(20, 28, 46, 0.75)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      height: '680px',
      maxHeight: '85vh',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(11, 17, 30, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={18} color="#FFFFFF" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              PropGPT Conversational Engine
            </h3>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
              Multi-turn slot extraction & real-time R Plumber inference
            </span>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Reset conversation"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94A3B8',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Trash2 size={13} />
          Clear Chat
        </button>
      </div>

      {/* Message stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSelectSuggestion={handleSendMessage}
          />
        ))}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={16} color="#38BDF8" className="animate-spin" />
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>
              PropGPT is analyzing property specifications...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(11, 17, 30, 0.7)'
      }}>
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
