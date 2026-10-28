import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp, Mic, MicOff, Paperclip, MapPin, ChevronDown,
  AlertCircle, FileText
} from 'lucide-react';
import { FEATURED_LOCALITIES } from '../../constants/localities';
import { createSpeechSession } from '../../services/speechRecognition';
import { getPreferences } from '../../services/chatStorage';

export default function ChatInput({
  onSendMessage,
  isLoading,
  placeholder = "Ask PropGPT anything about Hyderabad property prices, yields or land rates..."
}) {
  const [input, setInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [showLocalityMenu, setShowLocalityMenu] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState(null);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, interimText]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.dispose();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let textToSend = (input + (interimText ? ' ' + interimText : '')).trim();
    if (!textToSend && !attachedDoc) return;
    if (isLoading) return;

    if (selectedLocality && !textToSend.toLowerCase().includes(selectedLocality.toLowerCase())) {
      textToSend = `[Locality: ${selectedLocality}] ${textToSend}`;
    }

    if (attachedDoc) {
      textToSend = `[Attached Document: ${attachedDoc.name}] ${textToSend}`;
    }

    if (recognitionRef.current) {
      recognitionRef.current.dispose();
      recognitionRef.current = null;
      setIsListening(false);
    }

    onSendMessage(textToSend);
    setInput('');
    setInterimText('');
    setAttachedDoc(null);
    setSpeechError(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Web Speech API Voice Recognition (en-IN)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or type your message.");
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      const session = createSpeechSession({
        onInterim: (text) => setInterimText(text),
        onFinal: (text) => {
          setInput((prev) => (prev ? prev + ' ' + text : text));
          setInterimText('');
        },
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
          setTimeout(() => setSpeechError(null), 6000);
        },
        onEnd: () => {
          setIsListening(false);
        }
      });
      recognitionRef.current = session;
      session.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Speech init failed:", e);
      setSpeechError("Unable to initialize microphone. Check permissions.");
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 5000);
    }
  };

  // Simulated Document attachment upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedDoc({ name: file.name, size: file.size });
    }
  };

  const displayValue = input + (interimText ? (input ? ' ' : '') + interimText : '');

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
      {/* Voice Error Notification Banner */}
      {speechError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '8px',
          color: '#F5F5F5',
          fontSize: '12px'
        }}>
          <AlertCircle size={14} color="#EF4444" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Main Composer Container (Input background #1C1C1C, Borders #292929) */}
      <div style={{
        background: '#1C1C1C',
        border: '1px solid #292929',
        borderRadius: '20px',
        padding: '10px 14px',
        boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.7)',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Top Control Bar: Locality Chip + Doc attachment chip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {/* Locality Selector Dropdown Pill */}
            <button
              type="button"
              onClick={() => setShowLocalityMenu(!showLocalityMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: selectedLocality ? 'rgba(255, 23, 68, 0.12)' : '#171717',
                border: selectedLocality ? '1px solid rgba(255, 23, 68, 0.3)' : '1px solid #292929',
                color: selectedLocality ? '#FF1744' : '#B3B3B3',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <MapPin size={12} color={selectedLocality ? '#FF1744' : '#777777'} />
              <span>{selectedLocality ? selectedLocality : 'Hyderabad All Micro-Markets'}</span>
              <ChevronDown size={11} color="#777777" />
            </button>

            {/* Attached Doc Badge */}
            {attachedDoc && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 23, 68, 0.12)',
                border: '1px solid rgba(255, 23, 68, 0.3)',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '11px',
                color: '#FF1744'
              }}>
                <FileText size={11} />
                <span>{attachedDoc.name}</span>
                <button
                  onClick={() => setAttachedDoc(null)}
                  style={{ background: 'transparent', border: 'none', color: '#777777', cursor: 'pointer', padding: 0 }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Locality Menu Flyout */}
            {showLocalityMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '6px',
                  background: '#171717',
                  border: '1px solid #292929',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                  padding: '8px',
                  zIndex: 100,
                  width: '240px',
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                <div
                  onClick={() => { setSelectedLocality(''); setShowLocalityMenu(false); }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: !selectedLocality ? '#FF1744' : '#B3B3B3',
                    cursor: 'pointer',
                    background: !selectedLocality ? 'rgba(255, 23, 68, 0.1)' : 'transparent'
                  }}
                >
                  All Hyderabad Micro-Markets
                </div>
                {FEATURED_LOCALITIES.map(loc => (
                  <div
                    key={loc}
                    onClick={() => { setSelectedLocality(loc); setShowLocalityMenu(false); }}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: selectedLocality === loc ? '#FF1744' : '#F5F5F5',
                      cursor: 'pointer',
                      background: selectedLocality === loc ? 'rgba(255, 23, 68, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1C1C1C'}
                    onMouseLeave={(e) => {
                      if (selectedLocality !== loc) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#777777' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
            <span>Hyderabad listing datasets</span>
          </div>
        </div>

        {/* Textarea & Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {/* Document Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.png,.jpg,.jpeg,.dwg"
          />
          <button
            type="button"
            onClick={() => setSpeechError('Document analysis is not available. Please type or speak the property details.')}
            title="Document analysis is not available"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#171717',
              border: '1px solid #292929',
              color: '#777777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#292929';
              e.currentTarget.style.color = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#171717';
              e.currentTarget.style.color = '#777777';
            }}
          >
            <Paperclip size={16} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={displayValue}
            onChange={(e) => {
              recognitionRef.current?.dispose();
              recognitionRef.current = null;
              setIsListening(false);
              setInterimText('');
              setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F5F5F5',
              fontSize: '14px',
              lineHeight: 1.5,
              resize: 'none',
              maxHeight: '120px',
              fontFamily: "'Inter', sans-serif",
              padding: '6px 4px'
            }}
          />

          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Listening... Click to stop" : "Speak using Indian English voice (en-IN)"}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : '#171717',
              border: isListening ? '1px solid #EF4444' : '1px solid #292929',
              color: isListening ? '#EF4444' : '#777777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isListening) {
                e.currentTarget.style.background = '#292929';
                e.currentTarget.style.color = '#F5F5F5';
              }
            }}
            onMouseLeave={(e) => {
              if (!isListening) {
                e.currentTarget.style.background = '#171717';
                e.currentTarget.style.color = '#777777';
              }
            }}
          >
            {isListening ? (
              <>
                <MicOff size={16} />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  animation: 'pulseGlow 1s infinite'
                }} />
              </>
            ) : (
              <Mic size={16} />
            )}
          </button>

          {/* Submit Arrow Button (Primary Crimson Red) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!input.trim() && !interimText.trim() && !attachedDoc) || isLoading}
            aria-label="Send message"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading
                ? '#171717'
                : 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
              border: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading ? '1px solid #292929' : 'none',
              color: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading ? '#525252' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading
                ? 'none'
                : '0 0 16px rgba(255, 23, 68, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* Compliance / Legal Footnote */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#777777',
        marginTop: '8px'
      }}>
        Estimates use trained models and advertised listings. Actual prices vary; this is not a certified appraisal.
      </div>
    </div>
  );
}
