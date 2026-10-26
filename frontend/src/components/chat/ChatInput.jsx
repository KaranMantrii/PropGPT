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
      recognitionRef.current?.dispose();
      setInterimText('');
      const recognition = createSpeechSession({
        SpeechRecognition, initialText: input, preferences: getPreferences(),
        onText: setInput, onInterim: setInterimText,
        onListening: setIsListening, onError: setSpeechError
      });

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
      setSpeechError("Could not start microphone.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedDoc({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' });
    }
  };

  const displayValue = interimText
    ? (input ? `${input} ${interimText}` : interimText)
    : input;

  return (
    <div style={{
      width: '100%',
      maxWidth: '820px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Speech Error Banner */}
      {speechError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '8px',
          color: '#FCA5A5',
          fontSize: '12px'
        }}>
          <AlertCircle size={14} color="#EF4444" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Main Glassmorphic Composer Container */}
      <div style={{
        background: 'rgba(20, 28, 46, 0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '20px',
        padding: '10px 14px',
        boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.15)',
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
                background: selectedLocality ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedLocality ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: selectedLocality ? '#38BDF8' : '#CBD5E1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <MapPin size={12} color={selectedLocality ? '#38BDF8' : '#94A3B8'} />
              <span>{selectedLocality ? selectedLocality : 'Hyderabad All Micro-Markets'}</span>
              <ChevronDown size={11} color="#64748B" />
            </button>

            {/* Attached Doc Badge */}
            {attachedDoc && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '11px',
                color: '#C0C1FF'
              }}>
                <FileText size={11} />
                <span>{attachedDoc.name}</span>
                <button
                  onClick={() => setAttachedDoc(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
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
                  background: '#0D1320',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
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
                    color: !selectedLocality ? '#38BDF8' : '#94A3B8',
                    cursor: 'pointer',
                    background: !selectedLocality ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
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
                      color: selectedLocality === loc ? '#38BDF8' : '#E2E8F0',
                      cursor: 'pointer',
                      background: selectedLocality === loc ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#94A3B8';
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
              color: '#FFFFFF',
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
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: isListening ? '#EF4444' : '#94A3B8',
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
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#FFFFFF';
              }
            }}
            onMouseLeave={(e) => {
              if (!isListening) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94A3B8';
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

          {/* Submit Arrow Button */}
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
                ? 'rgba(255, 255, 255, 0.05)'
                : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #A855F7 100%)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading
                ? 'none'
                : '0 0 16px rgba(99, 102, 241, 0.45)',
              opacity: (!input.trim() && !interimText.trim() && !attachedDoc) || isLoading ? 0.4 : 1,
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
        color: '#64748B',
        marginTop: '8px'
      }}>
        Estimates use trained models and advertised listings. Actual prices vary; this is not a certified appraisal.
      </div>
    </div>
  );
}
