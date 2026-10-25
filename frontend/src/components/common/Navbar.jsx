import React, { useState, useEffect } from 'react';
import { Building2, Sparkles, Activity, MessageSquare, Calculator, TrendingUp, Layers } from 'lucide-react';
import { checkHealth } from '../../services/plumberApi';

export default function Navbar({ activeSection, onNavigate }) {
  const [backendOnline, setBackendOnline] = useState(null);

  useEffect(() => {
    async function verifyBackend() {
      const res = await checkHealth();
      setBackendOnline(res.status === 'ok' || res.status === 'healthy');
    }
    verifyBackend();
    const interval = setInterval(verifyBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(11, 17, 30, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand Identity */}
      <div 
        onClick={() => onNavigate('hero')}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
        }}>
          <Building2 size={24} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Prop<span style={{ color: '#38BDF8' }}>GPT</span>
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 7px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38BDF8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontWeight: 700
            }}>
              HYD v2.0
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '-2px' }}>
            Hyderabad Real Estate Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Anchors */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onNavigate('chat')}
          style={{
            background: activeSection === 'chat' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSection === 'chat' ? '#38BDF8' : '#94A3B8',
            border: activeSection === 'chat' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={16} />
          AI Chat
        </button>

        <button
          onClick={() => onNavigate('calculator')}
          style={{
            background: activeSection === 'calculator' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSection === 'calculator' ? '#38BDF8' : '#94A3B8',
            border: activeSection === 'calculator' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Calculator size={16} />
          Manual Valuation
        </button>

        <button
          onClick={() => onNavigate('market')}
          style={{
            background: activeSection === 'market' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSection === 'market' ? '#38BDF8' : '#94A3B8',
            border: activeSection === 'market' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <TrendingUp size={16} />
          Market Intel
        </button>

        <button
          onClick={() => onNavigate('workflow')}
          style={{
            background: activeSection === 'workflow' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSection === 'workflow' ? '#38BDF8' : '#94A3B8',
            border: activeSection === 'workflow' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Layers size={16} />
          How It Works
        </button>
      </nav>

      {/* Backend Status indicator badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '9999px',
        background: backendOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: backendOnline ? '#10B981' : '#F59E0B',
          boxShadow: `0 0 10px ${backendOnline ? '#10B981' : '#F59E0B'}`
        }} />
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: backendOnline ? '#34D399' : '#FBBF24'
        }}>
          {backendOnline === null ? 'Checking API...' : backendOnline ? 'R Plumber Live' : 'API Standby'}
        </span>
      </div>
    </header>
  );
}
