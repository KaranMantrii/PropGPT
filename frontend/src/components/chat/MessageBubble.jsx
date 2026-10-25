import React from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import PredictionCard from './PredictionCard';

export default function MessageBubble({ message, onSelectSuggestion }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '20px',
      width: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        maxWidth: isUser ? '85%' : '90%',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        {/* Avatar Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isUser ? 'rgba(56, 189, 248, 0.2)' : 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
          border: isUser ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isUser ? 'none' : '0 0 15px rgba(56, 189, 248, 0.3)'
        }}>
          {isUser ? <User size={18} color="#38BDF8" /> : <Bot size={18} color="#FFFFFF" />}
        </div>

        {/* Bubble Body */}
        <div>
          <div style={{
            background: isUser 
              ? 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)' 
              : 'rgba(20, 28, 46, 0.85)',
            border: isUser ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            color: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '14px',
            lineHeight: 1.6,
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
            whiteSpace: 'pre-line'
          }}>
            {message.content}
          </div>

          {/* Embedded Prediction Result Card if returned */}
          {message.prediction && (
            <PredictionCard
              prediction={message.prediction}
              propertyDetails={message.property_details || message.prediction}
              predictionType={message.prediction?.prediction_type}
            />
          )}

          {/* Follow-up / Suggestion chips */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion && onSelectSuggestion(suggestion)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '9999px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Sparkles size={12} />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div style={{
            fontSize: '11px',
            color: '#64748B',
            marginTop: '4px',
            textAlign: isUser ? 'right' : 'left'
          }}>
            {message.timestamp || 'Just now'}
          </div>
        </div>
      </div>
    </div>
  );
}
