export function createSpeechSession({ SpeechRecognition, initialText = '', preferences = {}, onText, onInterim, onListening, onError }) {
  if (!SpeechRecognition) {
    onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or type your message.');
    return null;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = preferences.speechLang || 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = preferences.enableInterimSpeech !== false;
  recognition.maxAlternatives = 3;
  let active = true;
  let receivedSpeech = false;
  let failed = false;
  recognition.onstart = () => { if (active) onListening(true); };
  recognition.onresult = event => {
    if (!active) return;
    const final = [];
    const interim = [];
    // Rebuild from the complete result list: browsers may repeat earlier results.
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript?.trim();
      if (text) (result.isFinal ? final : interim).push(text);
    }
    receivedSpeech ||= final.length > 0 || interim.length > 0;
    onText([initialText.trim(), ...final].filter(Boolean).join(' '));
    onInterim(interim.join(' '));
  };
  recognition.onerror = event => {
    if (!active) return;
    failed = true;
    const messages = {
      'not-allowed': 'Microphone access was denied. Please allow microphone access in browser settings.',
      'service-not-allowed': 'Speech recognition permission was denied.',
      'no-speech': 'No speech was detected. Please try again or type your message.',
      'audio-capture': 'No microphone is available. Please check your audio input.',
      network: 'Speech recognition could not connect. Please try again or type your message.'
    };
    if (event.error !== 'aborted') onError(messages[event.error] || 'Speech recognition failed. Please try again.');
    onListening(false);
    onInterim('');
  };
  recognition.onend = () => {
    if (!active) return;
    if (!receivedSpeech && !failed) onError('No speech was detected. Please try again or type your message.');
    onListening(false);
    onInterim('');
    active = false;
  };
  return {
    start() { recognition.start(); },
    stop() { recognition.stop(); },
    dispose() {
      active = false;
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    }
  };
}
