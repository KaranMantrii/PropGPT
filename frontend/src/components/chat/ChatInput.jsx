import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, AlertCircle } from 'lucide-react';

export default function ChatInput({ onSendMessage, isLoading, placeholder = "Ask PropGPT anything about Hyderabad property prices..." }) {
  const [input, setInput] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseInputRef = useRef('');

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
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const finalMessage = (input + (interimText ? ' ' + interimText : '')).trim();
    if (!finalMessage || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    onSendMessage(finalMessage);
    setInput('');
    setInterimText('');
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

  // Web Speech API Voice Recognition according to Section 4
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
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      baseInputRef.current = input.trim();

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentFinal) {
          const prefix = baseInputRef.current ? `${baseInputRef.current} ` : '';
          const updatedInput = `${prefix}${currentFinal.trim()}`;
          setInput(updatedInput);
          baseInputRef.current = updatedInput;
          setInterimText('');
        } else {
          setInterimText(currentInterim.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error event:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("Microphone access was denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech') {
          // Normal timeout if user stayed silent; no intrusive error
        } else if (event.error === 'network') {
          setSpeechError("Network error during speech recognition.");
        } else {
          setSpeechError(`Speech error: ${event.error}`);
        }
        setIsListening(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
      setIsListening(false);
      setSpeechError("Could not start microphone. Please check permissions.");
    }
  };

  const displayValue = interimText 
    ? (input ? `${input} ${interimText}` : interimText)
    : input;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Speech Error Banner */}
      {speechError && (
        <div style={{
          position: 'absolute',
          top: '-42px',
          left: 0,
          right: 0,
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#FFFFFF',
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          <AlertCircle size={14} />
          <span>{speechError}</span>
        </div>
      )}

      {/* Main Input Box */}
      <div style={{
        background: 'rgba(20, 28, 46, 0.95)',
        border: `1px solid ${isListening ? '#38BDF8' : 'rgba(56, 189, 248, 0.25)'}`,
        borderRadius: '16px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: isListening 
          ? '0 0 20px rgba(56, 189, 248, 0.35)' 
          : '0 8px 32px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.2s'
      }}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={displayValue}
          onChange={(e) => {
            setInput(e.target.value);
            baseInputRef.current = e.target.value;
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... speak now (Indian English)..." : placeholder}
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            resize: 'none',
            maxHeight: '120px',
            lineHeight: 1.5,
            padding: '8px 4px'
          }}
        />

        {/* Live Audio Waves indicator when listening */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0 6px' }}>
            <span style={{ width: '3px', height: '14px', background: '#38BDF8', borderRadius: '2px', animation: 'pulseGlow 0.8s ease-in-out infinite' }} />
            <span style={{ width: '3px', height: '20px', background: '#38BDF8', borderRadius: '2px', animation: 'pulseGlow 0.6s ease-in-out infinite' }} />
            <span style={{ width: '3px', height: '12px', background: '#38BDF8', borderRadius: '2px', animation: 'pulseGlow 0.9s ease-in-out infinite' }} />
          </div>
        )}

        {/* Voice Input Microphone Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? "Stop listening" : "Speak message (Web Speech API - en-IN)"}
          style={{
            background: isListening ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isListening ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)'}`,
            color: isListening ? '#38BDF8' : '#94A3B8',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.2s',
            boxShadow: isListening ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none'
          }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!displayValue.trim() || isLoading}
          title="Send message"
          style={{
            background: displayValue.trim() && !isLoading 
              ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' 
              : 'rgba(255, 255, 255, 0.05)',
            color: displayValue.trim() && !isLoading ? '#FFFFFF' : '#475569',
            border: 'none',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: displayValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            boxShadow: displayValue.trim() && !isLoading ? '0 0 15px rgba(56, 189, 248, 0.4)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
