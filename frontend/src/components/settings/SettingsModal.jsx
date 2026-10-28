import React, { useState } from 'react';
import { 
  X, Settings, Server, Mic, IndianRupee, Trash2, 
  RefreshCw, Check, AlertCircle, ShieldCheck, Cpu 
} from 'lucide-react';
import { getPreferences, savePreferences, clearAllSessions } from '../../services/chatStorage';
import { checkHealth } from '../../services/plumberApi';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  onClearHistory,
  totalSessions = 1 
}) {
  const [prefs, setPrefs] = useState(() => getPreferences());
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingBackend(true);
    setBackendStatus(null);
    try {
      const res = await checkHealth(prefs.backendUrl);
      if (res && res.status === 'ok') {
        setBackendStatus({ ok: true, msg: `Connected successfully (${res.service || 'PropGPT'})` });
      } else {
        setBackendStatus({ ok: false, msg: res.error || 'Server responded with unexpected status' });
      }
    } catch (e) {
      setBackendStatus({ ok: false, msg: e.message || 'Connection failed' });
    } finally {
      setTestingBackend(false);
    }
  };

  const handleSave = () => {
    savePreferences(prefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all saved conversations? This cannot be undone.')) {
      clearAllSessions();
      if (onClearHistory) onClearHistory();
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(8, 8, 8, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: '#171717',
        border: '1px solid #292929',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
        overflow: 'hidden',
        animation: 'fadeIn 0.25s ease-out forwards'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #292929',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#111111'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
                Valuation Engine Settings
              </h2>
              <span style={{ fontSize: '11px', color: '#777777' }}>
                System configuration & preferences
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#1C1C1C',
              border: '1px solid #292929',
              borderRadius: '8px',
              color: '#B3B3B3',
              padding: '6px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Section 1: Backend Connection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Server size={15} color="#FF1744" />
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                R Plumber API Endpoint
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={prefs.backendUrl}
                onChange={(e) => setPrefs({ ...prefs, backendUrl: e.target.value })}
                style={{
                  flex: 1,
                  background: '#1C1C1C',
                  border: '1px solid #292929',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#F5F5F5',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingBackend}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  background: '#1C1C1C',
                  border: '1px solid #292929',
                  color: '#F5F5F5',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {testingBackend ? <RefreshCw size={13} className="animate-spin" /> : 'Test Ping'}
              </button>
            </div>
            {backendStatus && (
              <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: backendStatus.ok ? '#22C55E' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {backendStatus.ok ? <Check size={12} /> : <AlertCircle size={12} />}
                <span>{backendStatus.msg}</span>
              </div>
            )}
          </div>

          {/* Section 2: Speech Recognition */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Mic size={15} color="#B00035" />
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                Voice Speech Recognition (Web Speech API)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={prefs.speechLang}
                onChange={(e) => setPrefs({ ...prefs, speechLang: e.target.value })}
                style={{
                  flex: 1,
                  background: '#1C1C1C',
                  border: '1px solid #292929',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  color: '#F5F5F5',
                  fontSize: '13px'
                }}
              >
                <option value="en-IN">Indian English (en-IN) - Recommended</option>
                <option value="en-US">US English (en-US)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Currency & Units */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <IndianRupee size={15} color="#22C55E" />
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
                Currency Display Format
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, currencyDisplay: 'inr_crores_lakhs' })}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: prefs.currencyDisplay === 'inr_crores_lakhs' ? '1px solid #FF1744' : '1px solid #292929',
                  background: prefs.currencyDisplay === 'inr_crores_lakhs' ? 'rgba(255, 23, 68, 0.15)' : '#1C1C1C',
                  color: prefs.currencyDisplay === 'inr_crores_lakhs' ? '#FF1744' : '#B3B3B3',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Indian (₹ Crores & Lakhs)
              </button>
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, currencyDisplay: 'standard' })}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: prefs.currencyDisplay === 'standard' ? '1px solid #FF1744' : '1px solid #292929',
                  background: prefs.currencyDisplay === 'standard' ? 'rgba(255, 23, 68, 0.15)' : '#1C1C1C',
                  color: prefs.currencyDisplay === 'standard' ? '#FF1744' : '#B3B3B3',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Full Rupee Amount
              </button>
            </div>
          </div>

          {/* Section 4: Data & Local Storage */}
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444' }}>
                  Conversation Cache
                </div>
                <div style={{ fontSize: '11px', color: '#B3B3B3', marginTop: '2px' }}>
                  {totalSessions} saved valuation session{totalSessions === 1 ? '' : 's'} stored in browser
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Clear All History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #292929',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          background: '#111111'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: '#1C1C1C',
              border: '1px solid #292929',
              color: '#B3B3B3',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-gradient"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {savedSuccess ? (
              <>
                <Check size={14} />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
