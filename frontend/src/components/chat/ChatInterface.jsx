import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Trash2, Bot, Menu
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ChatHomeEmptyState from './ChatHomeEmptyState';
import { sendChatMessage } from '../../services/plumberApi';
import { updateSessionMessages } from '../../services/chatStorage';

export default function ChatInterface({
  session,
  onUpdateSession,
  onNewChat,
  onOpenMobileMenu,
  pendingPrompt,
  onConsumePrompt
}) {
  const [messages, setMessages] = useState(() => session?.messages || []);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const sendingRef = useRef(false);
  const consumedPromptRef = useRef(null);
  const backendSessionRef = useRef(session.backendSessionId || session.id);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (text) => {
    if (!text || !text.trim() || sendingRef.current) return;
    sendingRef.current = true;
    const backendSessionId = backendSessionRef.current;

    const userMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateSessionMessages(session.id, newMessages);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(backendSessionId, text);

      const predictionData = response.prediction ? {
        predicted_price: response.prediction,
        prediction_type: response.intent || response.prediction_type || (response.property?.intent) || 'flat_price'
      } : null;

      const aiMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: response.reply || response.message || "I have analyzed your property request against Hyderabad micro-market datasets.",
        prediction: predictionData,
        property_details: response.property || response.property_details || (response.conversation_state?.required_fields) || null,
        suggestions: response.suggested_replies || response.suggestions || null,
        map: response.map || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, aiMessage];
      if (mountedRef.current) setMessages(finalMessages);
      updateSessionMessages(session.id, finalMessages);
      if (onUpdateSession) onUpdateSession();
    } catch (err) {
      console.warn("Plumber chat API error:", err);

      // Never fabricate a predicted price. Return an honest error message with retry guidance.
      const errorMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: `I couldn't complete that request. ${err.message || 'Please check the connection and try again.'}`,
        prediction: null,
        property_details: null,
        suggestions: [
          text,
          "Estimate price of a 2 BHK in Kukatpally 1200 sqft",
          "What is the average rate in Kokapet?"
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...newMessages, errorMessage];
      if (mountedRef.current) setMessages(finalMessages);
      updateSessionMessages(session.id, finalMessages);
      if (onUpdateSession) onUpdateSession();
    } finally {
      sendingRef.current = false;
      if (mountedRef.current) setIsLoading(false);
    }
  }, [messages, onUpdateSession, session.id]);

  useEffect(() => {
    if (pendingPrompt && consumedPromptRef.current !== pendingPrompt.id) {
      consumedPromptRef.current = pendingPrompt.id;
      handleSendMessage(pendingPrompt.text);
      onConsumePrompt?.();
    }
  }, [pendingPrompt, onConsumePrompt, handleSendMessage]);

  const handleClearCurrentChat = () => {
    if (sendingRef.current) return;
    if (confirm('Clear messages in this conversation?')) {
      const resetMessages = [
        {
          id: 'welcome_reset',
          role: 'assistant',
          content: "Conversation cleared. How can I assist you with your property valuation today?",
          suggestions: [
            "3 BHK Flat in Kokapet 1800 sqft",
            "2 BHK Flat in Kukatpally Resale 1200 sqft",
            "4 BHK Villa in Jubilee Hills 3200 sqft",
            "2 BHK Rental in Gachibowli Furnished 1350 sqft"
          ],
          timestamp: 'Just now'
        }
      ];
      setMessages(resetMessages);
      backendSessionRef.current = `session_${crypto.randomUUID()}`;
      updateSessionMessages(session.id, resetMessages, backendSessionRef.current);
      if (onUpdateSession) onUpdateSession();
    }
  };

  // Determine if we are at empty/home state (only initial welcome message, 0 user messages)
  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const isHomeEmptyState = userMessagesCount === 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      position: 'relative',
      background: '#111111',
      overflow: 'hidden'
    }}>
      {/* Ambient Radial Gradients (Burgundy & Ruby atmospheric accents) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(106, 0, 63, 0.08) 0%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(176, 0, 53, 0.06) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Bar */}
      <header className="chat-header" style={{
        padding: '12px 20px',
        borderBottom: '1px solid #292929',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0D0D0D',
        zIndex: 20
      }}>
        {/* Left: Mobile hamburger + Active Chat Title */}
        <div className="chat-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="mobile-hamburger-btn"
              aria-label="Open navigation"
              style={{
                display: 'none',
                background: '#1C1C1C',
                border: '1px solid #292929',
                borderRadius: '8px',
                padding: '6px',
                color: '#F5F5F5',
                cursor: 'pointer'
              }}
            >
              <Menu size={18} />
            </button>
          )}

          <div className="chat-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#F5F5F5',
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {session?.title || "Property Valuation"}
            </span>
            <span className="chat-property-tag" style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '9999px',
              background: 'rgba(255, 23, 68, 0.1)',
              color: '#FF1744',
              border: '1px solid rgba(255, 23, 68, 0.25)',
              fontWeight: 600
            }}>
              {session?.propertyType || "Conversational"}
            </span>
          </div>
        </div>

        {/* Right: Actions (New Chat, Clear, Share) */}
        <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onNewChat}
            className="chat-new-button"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 23, 68, 0.1)',
              border: '1px solid rgba(255, 23, 68, 0.25)',
              color: '#FF1744',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>+ New Chat</span>
          </button>

          <button
            onClick={handleClearCurrentChat}
            title="Clear conversation"
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: '#171717',
              border: '1px solid #292929',
              color: '#777777',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F5F5F5';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#777777';
              e.currentTarget.style.borderColor = '#292929';
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* Main Conversation Scrollable Viewport */}
      <div
        ref={containerRef}
        className="chat-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 140px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10
        }}
      >
        {isHomeEmptyState ? (
          <div style={{ margin: 'auto 0' }}>
            <ChatHomeEmptyState onSelectPrompt={handleSendMessage} />
          </div>
        ) : (
          <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto' }}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSelectSuggestion={handleSendMessage}
                onAskAiAboutValuation={handleSendMessage}
              />
            ))}

            {/* Loading Indicator Bubble */}
            {isLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(255, 23, 68, 0.35)'
                }}>
                  <Bot size={16} color="#FFFFFF" />
                </div>
                <div style={{
                  background: '#171717',
                  border: '1px solid #292929',
                  padding: '14px 18px',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#F5F5F5',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF1744', animation: 'pulseGlow 1s infinite 0s' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B00035', animation: 'pulseGlow 1s infinite 0.2s' }} />
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6A003F', animation: 'pulseGlow 1s infinite 0.4s' }} />
                  </div>
                  <span>Reviewing your property details...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistent Bottom Floating Composer */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '0 20px 16px',
        background: 'linear-gradient(to top, rgba(17, 17, 17, 0.98) 70%, transparent 100%)',
        zIndex: 30
      }}>
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
