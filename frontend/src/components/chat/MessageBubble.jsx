import React from 'react';
import { Bot, User, Sparkles, Building2, Copy, Check } from 'lucide-react';
import PredictionCard from './PredictionCard';
import PropertyMap from '../map/PropertyMap';

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
            <li key={idx} style={{ color: '#F5F5F5', lineHeight: 1.5 }}>
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
            background: '#1C1C1C',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #292929'
          }}>
            <tbody>
              {tableRows.map((row, rIdx) => {
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                const isHeader = rIdx === 0;
                return (
                  <tr key={rIdx} style={{
                    background: isHeader ? 'rgba(255, 23, 68, 0.1)' : (rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'),
                    borderBottom: '1px solid #292929'
                  }}>
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} style={{
                        padding: '7px 10px',
                        fontWeight: isHeader ? 700 : 400,
                        color: isHeader ? '#F5F5F5' : '#B3B3B3'
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
      listItems.push(trimmed.replace(/^(\* |- |• )/, ''));
      return;
    } else if (inList) {
      flushList();
    }

    // Blank line
    if (!trimmed) {
      elements.push(<div key={`br_${index}`} style={{ height: '8px' }} />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p_${index}`} style={{ margin: '4px 0', color: '#F5F5F5' }}>
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
            ? '#171717'
            : 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
          border: isUser ? '1px solid #292929' : '1px solid rgba(255, 23, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isUser ? 'none' : '0 0 15px rgba(255, 23, 68, 0.35)'
        }}>
          {isUser ? <User size={16} color="#B3B3B3" /> : <Building2 size={16} color="#FFFFFF" />}
        </div>

        {/* Message Bubble Body */}
        <div style={{ maxWidth: '100%' }}>
          <div style={{
            background: isUser ? '#1C1C1C' : '#171717',
            border: '1px solid #292929',
            color: '#F5F5F5',
            padding: '14px 18px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '14px',
            lineHeight: 1.6,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
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
                color: copied ? '#22C55E' : '#777777',
                cursor: 'pointer',
                opacity: 0.7,
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

          {/* Interactive Property & Nearby Amenities Map */}
          {message.map && message.map.center && (
            <div style={{ marginTop: '14px', width: '100%' }}>
              <PropertyMap mapData={message.map} />
            </div>
          )}

          {/* Follow-up / Suggestion chips */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {message.suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion && onSelectSuggestion(suggestion)}
                  style={{
                    background: 'rgba(255, 23, 68, 0.08)',
                    color: '#F5F5F5',
                    border: '1px solid #292929',
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
                    e.currentTarget.style.background = 'rgba(255, 23, 68, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(255, 23, 68, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 23, 68, 0.08)';
                    e.currentTarget.style.borderColor = '#292929';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Sparkles size={12} color="#FF1744" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div style={{
            fontSize: '11px',
            color: '#777777',
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
