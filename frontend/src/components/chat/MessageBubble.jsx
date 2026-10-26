import React from 'react';
import { Bot, User, Sparkles, Building2, Copy, Check } from 'lucide-react';
import PredictionCard from './PredictionCard';

/**
 * Lightweight helper to format markdown-style text:
 * Supports **bold**, *italic*, bullet lists (`* ` or `- `), numbered lists, and simple tables.
 */
function FormattedContent({ content }) {
  if (!content) return null;

  // Split lines
  const lines = String(content).split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let tableRows = [];
  let inTable = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul_${elements.length}`} style={{ paddingLeft: '20px', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ color: '#E2E8F0', lineHeight: 1.5 }}>
              {renderFormattedInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table_${elements.length}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            background: 'rgba(11, 17, 30, 0.7)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <tbody>
              {tableRows.map((row, rIdx) => {
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const isHeader = rIdx === 0;
                return (
                  <tr key={rIdx} style={{
                    background: isHeader ? 'rgba(99, 102, 241, 0.15)' : (rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} style={{
                        padding: '7px 10px',
                        fontWeight: isHeader ? 700 : 400,
                        color: isHeader ? '#FFFFFF' : '#CBD5E1'
                      }}>
                        {renderFormattedInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Markdown Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) return; // separator row
      flushList();
      inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      flushTable();
    }

    // Bullet List Detection
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      inList = true;
      listItems.push(trimmed.replace(/^(\*|-|•)\s+/, ''));
      return;
    } else if (inList) {
      flushList();
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4_${index}`} style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '12px 0 6px' }}>
          {renderFormattedInline(trimmed.replace('### ', ''))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3_${index}`} style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: '14px 0 6px' }}>
          {renderFormattedInline(trimmed.replace('## ', ''))}
        </h3>
      );
      return;
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={`sp_${index}`} style={{ height: '8px' }} />);
      return;
    }

    // Normal paragraph
    elements.push(
      <p key={`p_${index}`} style={{ margin: '4px 0', lineHeight: 1.6 }}>
        {renderFormattedInline(trimmed)}
      </p>
    );
  });

  flushList();
  flushTable();

  return <>{elements}</>;
}

function renderFormattedInline(text) {
  // Replace **bold**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ color: '#FFFFFF', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function MessageBubble({
  message,
  onSelectSuggestion,
  onAskAiAboutValuation
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '22px',
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
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: isUser
            ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)'
            : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #A855F7 100%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isUser ? 'none' : '0 0 15px rgba(99, 102, 241, 0.35)'
        }}>
          {isUser ? <User size={16} color="#FFFFFF" /> : <Building2 size={16} color="#FFFFFF" />}
        </div>

        {/* Message Bubble Body */}
        <div style={{ maxWidth: '100%' }}>
          <div style={{
            background: isUser
              ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
              : 'rgba(20, 28, 46, 0.85)',
            border: isUser
              ? '1px solid rgba(99, 102, 241, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
            color: '#F8FAFC',
            padding: '14px 18px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '14px',
            lineHeight: 1.6,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
            position: 'relative'
          }}>
            <FormattedContent content={message.content} />

            {/* Quick copy text */}
            <button
              onClick={handleCopy}
              title="Copy response"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: copied ? '#34D399' : '#64748B',
                cursor: 'pointer',
                opacity: 0.6,
                padding: '2px'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>

          {/* Embedded Prediction Result Card if returned */}
          {message.prediction && (
            <PredictionCard
              prediction={message.prediction}
              propertyDetails={message.property_details || message.prediction}
              predictionType={message.prediction?.prediction_type}
              onAskAiAboutValuation={onAskAiAboutValuation}
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
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#C0C1FF',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
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
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
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
            marginTop: '5px',
            textAlign: isUser ? 'right' : 'left'
          }}>
            {message.timestamp || 'Just now'}
          </div>
        </div>
      </div>
    </div>
  );
}
