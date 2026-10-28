import React, { useState } from 'react';
import { 
  Building2, Plus, MessageSquare, Calculator, Search, History, 
  Trash2, Edit2, Check, X, Settings, Sparkles, ChevronRight,
  Activity, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function Sidebar({
  activeView, // 'chat' | 'predictor'
  onSelectView,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  backendStatus = 'online',
  isMobileOpen = false,
  onCloseMobile
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    return session.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (e, sessionId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDeleteSession(sessionId);
    }
  };

  // Group sessions by date
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const grouped = {
    today: [],
    previous7Days: [],
    older: []
  };

  filteredSessions.forEach(session => {
    const time = session.updatedAt || session.createdAt || now;
    const diff = now - time;
    if (diff < oneDay) {
      grouped.today.push(session);
    } else if (diff < sevenDays) {
      grouped.previous7Days.push(session);
    } else {
      grouped.older.push(session);
    }
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8, 8, 8, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 45
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        style={{
          width: '280px',
          height: '100vh',
          background: '#0D0D0D',
          borderRight: '1px solid #292929',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: isMobileOpen ? '0 0 40px rgba(0,0,0,0.9)' : 'none'
        }}
        className="sidebar-desktop-visible"
      >
        {/* Header / Brand Cluster */}
        <div style={{
          padding: '20px 18px 14px',
          borderBottom: '1px solid #292929',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
              padding: '1px',
              boxShadow: '0 0 16px rgba(255, 23, 68, 0.35)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#0D0D0D',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={18} color="#FF1744" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '18px',
                  letterSpacing: '-0.02em',
                  color: '#F5F5F5'
                }}>
                  PropGPT
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 23, 68, 0.12)',
                  color: '#FF1744',
                  border: '1px solid rgba(255, 23, 68, 0.25)'
                }}>
                  v4.2 ML
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#777777' }}>
                Hyderabad Real Estate AI
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: '#B3B3B3',
                cursor: 'pointer',
                padding: '4px'
              }}
              className="mobile-close-btn"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Primary CTA: + New Valuation Chat */}
        <div style={{ padding: '14px 14px 8px' }}>
          <button
            onClick={() => {
              onNewChat();
              if (onCloseMobile) onCloseMobile();
            }}
            className="btn-gradient"
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: '13px',
              letterSpacing: '0.02em',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>+ New Valuation Chat</span>
          </button>
        </div>

        {/* Primary Navigation Workflows */}
        <div style={{ padding: '6px 14px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Chat Workflow */}
          <button
            onClick={() => {
              onSelectView('chat');
              if (onCloseMobile) onCloseMobile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              border: activeView === 'chat' ? '1px solid rgba(255, 23, 68, 0.35)' : '1px solid transparent',
              background: activeView === 'chat' ? 'rgba(255, 23, 68, 0.1)' : 'transparent',
              color: activeView === 'chat' ? '#F5F5F5' : '#B3B3B3',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeView === 'chat' ? 600 : 500,
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'chat') {
                e.currentTarget.style.background = '#171717';
                e.currentTarget.style.color = '#F5F5F5';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'chat') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#B3B3B3';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={16} color={activeView === 'chat' ? '#FF1744' : '#777777'} />
              <span>AI Real Estate Chat</span>
            </div>
            {activeView === 'chat' && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FF1744',
                boxShadow: '0 0 8px #FF1744'
              }} />
            )}
          </button>

          {/* Manual Predictor Workflow */}
          <button
            onClick={() => {
              onSelectView('predictor');
              if (onCloseMobile) onCloseMobile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              border: activeView === 'predictor' ? '1px solid rgba(255, 23, 68, 0.35)' : '1px solid transparent',
              background: activeView === 'predictor' ? 'rgba(255, 23, 68, 0.1)' : 'transparent',
              color: activeView === 'predictor' ? '#F5F5F5' : '#B3B3B3',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeView === 'predictor' ? 600 : 500,
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'predictor') {
                e.currentTarget.style.background = '#171717';
                e.currentTarget.style.color = '#F5F5F5';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'predictor') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#B3B3B3';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={16} color={activeView === 'predictor' ? '#FF1744' : '#777777'} />
              <span>Manual Price Predictor</span>
            </div>
            {activeView === 'predictor' && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#FF1744',
                boxShadow: '0 0 8px #FF1744'
              }} />
            )}
          </button>
        </div>

        {/* History Search Bar */}
        <div style={{ padding: '0 14px 8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1C1C1C',
            border: '1px solid #292929',
            borderRadius: '8px',
            padding: '6px 10px'
          }}>
            <Search size={14} color="#777777" />
            <input
              type="text"
              placeholder="Search previous valuations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#F5F5F5',
                fontSize: '12px',
                outline: 'none',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: '#777777', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Recent Conversations List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#777777'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <History size={12} />
              <span>Recent Valuations</span>
            </div>
            <span>{filteredSessions.length} total</span>
          </div>

          {/* Group: Today */}
          {grouped.today.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#777777', fontWeight: 600, padding: '2px 8px 4px', textTransform: 'uppercase' }}>
                Today
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grouped.today.map(session => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Group: Previous 7 Days */}
          {grouped.previous7Days.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#777777', fontWeight: 600, padding: '2px 8px 4px', textTransform: 'uppercase' }}>
                Previous 7 Days
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grouped.previous7Days.map(session => renderSessionItem(session))}
              </div>
            </div>
          )}

          {/* Group: Older */}
          {grouped.older.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#777777', fontWeight: 600, padding: '2px 8px 4px', textTransform: 'uppercase' }}>
                Older Valuations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grouped.older.map(session => renderSessionItem(session))}
              </div>
            </div>
          )}

          {filteredSessions.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '24px 12px',
              color: '#777777',
              fontSize: '12px'
            }}>
              No matching valuations found.
            </div>
          )}
        </div>

        {/* Bottom Cluster: Status & Settings */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid #292929',
          background: '#0D0D0D',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Micro-market Engine Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '8px',
            background: '#171717',
            border: '1px solid #292929'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                position: 'relative',
                display: 'flex',
                height: '8px',
                width: '8px'
              }}>
                <span style={{
                  position: 'absolute',
                  display: 'inline-flex',
                  height: '100%',
                  width: '100%',
                  borderRadius: '50%',
                  background: backendStatus === 'online' ? '#22C55E' : '#F59E0B',
                  opacity: 0.75,
                  animation: 'pulseGlow 2s infinite'
                }} />
                <span style={{
                  position: 'relative',
                  display: 'inline-flex',
                  borderRadius: '50%',
                  height: '8px',
                  width: '8px',
                  background: backendStatus === 'online' ? '#22C55E' : '#F59E0B'
                }} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#F5F5F5', lineHeight: 1.2 }}>
                  Hyderabad Micro-Market
                </span>
                <span style={{ fontSize: '10px', color: '#777777', fontFamily: 'monospace' }}>
                  v2025.1 ML :8000
                </span>
              </div>
            </div>

            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: backendStatus === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: backendStatus === 'online' ? '#22C55E' : '#F59E0B',
              border: `1px solid ${backendStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              fontWeight: 600
            }}>
              {backendStatus === 'online' ? 'Active' : 'Offline'}
            </span>
          </div>

          {/* Settings Trigger Button */}
          <button
            onClick={() => {
              onOpenSettings();
              if (onCloseMobile) onCloseMobile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid transparent',
              color: '#B3B3B3',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#171717';
              e.currentTarget.style.color = '#F5F5F5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#B3B3B3';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={15} color="#777777" />
              <span>Valuation Settings & Models</span>
            </div>
            <ChevronRight size={14} color="#777777" />
          </button>
        </div>
      </aside>
    </>
  );

  function renderSessionItem(session) {
    const isActive = session.id === currentSessionId && activeView === 'chat';
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        onClick={() => {
          if (!isEditing) {
            onSelectSession(session.id);
            if (onCloseMobile) onCloseMobile();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderRadius: '8px',
          background: isActive ? 'rgba(255, 23, 68, 0.1)' : 'transparent',
          border: isActive ? '1px solid rgba(255, 23, 68, 0.3)' : '1px solid transparent',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          group: 'true'
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = '#171717';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        {isEditing ? (
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(e, session.id);
                if (e.key === 'Escape') handleCancelRename(e);
              }}
              style={{
                flex: 1,
                background: '#1C1C1C',
                border: '1px solid #FF1744',
                borderRadius: '4px',
                padding: '3px 6px',
                color: '#F5F5F5',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={(e) => handleSaveRename(e, session.id)}
              style={{ background: '#22C55E', border: 'none', color: '#FFF', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}
            >
              <Check size={12} />
            </button>
            <button
              onClick={handleCancelRename}
              style={{ background: 'transparent', border: 'none', color: '#777777', padding: '3px', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <MessageSquare size={13} color={isActive ? '#FF1744' : '#777777'} style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F5F5F5' : '#B3B3B3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {session.title}
                </span>
                {session.propertyType && (
                  <span style={{ fontSize: '10px', color: '#777777' }}>
                    {session.propertyType}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Icons on hover or active */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2px', 
                opacity: isActive ? 1 : 0.4,
                transition: 'opacity 0.2s' 
              }}
              className="session-action-buttons"
            >
              <button
                onClick={(e) => handleStartRename(e, session)}
                title="Rename valuation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#777777',
                  padding: '3px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                title="Delete valuation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  padding: '3px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
}
