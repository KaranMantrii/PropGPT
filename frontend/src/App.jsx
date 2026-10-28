import React, { useState, useEffect } from 'react';
import Sidebar from './components/sidebar/Sidebar';
import ChatInterface from './components/chat/ChatInterface';
import ManualPredictionForm from './components/manual-form/ManualPredictionForm';
import SettingsModal from './components/settings/SettingsModal';
import {
  getSessions,
  getCurrentSessionId,
  setCurrentSessionId,
  createNewSession,
  deleteSession,
  renameSession,
  updateSessionMessages
} from './services/chatStorage';
import { checkHealth } from './services/plumberApi';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'predictor'
  const [sessions, setSessions] = useState(() => getSessions());
  const [currentSessionId, setCurrentSessionIdState] = useState(() => getCurrentSessionId());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [pendingPrompt, setPendingPrompt] = useState(null);

  // Verify backend health on mount
  useEffect(() => {
    let mounted = true;
    const refreshHealth = () => checkHealth()
      .then(res => {
        if (!mounted) return;
        if (res && res.status === 'ok') {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('offline');
      });

    refreshHealth();
    const interval = setInterval(refreshHealth, 30000);
    window.addEventListener('propgpt-preferences-changed', refreshHealth);
    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('propgpt-preferences-changed', refreshHealth);
    };
  }, []);

  // Current active session object
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || null;

  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setCurrentSessionIdState(sessionId);
    setActiveView('chat');
  };

  const handleNewChat = () => {
    const fresh = createNewSession("New Property Valuation");
    setSessions(getSessions());
    setCurrentSessionIdState(fresh.id);
    setActiveView('chat');
  };

  const handleDeleteSession = (sessionId) => {
    const updated = deleteSession(sessionId);
    setSessions(updated);
    setCurrentSessionIdState(getCurrentSessionId());
  };

  const handleRenameSession = (sessionId, newTitle) => {
    renameSession(sessionId, newTitle);
    setSessions(getSessions());
  };

  const handleUpdateSession = () => {
    setSessions(getSessions());
  };

  const handleAskAiFromPredictor = (promptText, context) => {
    setActiveView('chat');
    const fresh = createNewSession('Manual valuation discussion');
    if (context?.backendSessionId) updateSessionMessages(fresh.id, fresh.messages, context.backendSessionId);
    setSessions(getSessions());
    setCurrentSessionIdState(fresh.id);
    setPendingPrompt({ id: crypto.randomUUID(), text: promptText });
  };

  return (
    <div className="app-container">
      {/* Compact Dark Sidebar with Multi-turn History */}
      <Sidebar
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        backendStatus={backendStatus}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Conversational / Valuation Workspace */}
      <main className="main-workspace">
        {activeView === 'chat' && currentSession ? (
          <ChatInterface
            key={currentSession.id}
            session={currentSession}
            onUpdateSession={handleUpdateSession}
            onNewChat={handleNewChat}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            pendingPrompt={pendingPrompt}
            onConsumePrompt={() => setPendingPrompt(null)}
          />
        ) : (
          <div style={{
            minHeight: '100vh',
            background: '#080808',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Minimal Mobile Header when on Predictor View */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid #292929',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0D0D0D'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="mobile-hamburger-btn"
                  style={{
                    background: '#1C1C1C',
                    border: '1px solid #292929',
                    borderRadius: '8px',
                    padding: '6px',
                    color: '#F5F5F5',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>☰</span>
                </button>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F5' }}>
                  Manual Model Predictor (3-Tab)
                </span>
              </div>

              <button
                onClick={() => setActiveView('chat')}
                className="btn-glass"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#FF1744'
                }}
              >
                Switch to Chat →
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ManualPredictionForm
                onAskAiInstead={(prompt, context) => {
                  handleAskAiFromPredictor(prompt, context);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal (Screen 6) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={() => {
          setSessions(getSessions());
          setCurrentSessionIdState(getCurrentSessionId());
        }}
        totalSessions={sessions.length}
      />
    </div>
  );
}
