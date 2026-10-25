import React, { useState, useRef } from 'react';
import Navbar from './components/common/Navbar';
import HeroSection from './components/hero/HeroSection';
import ChatInterface from './components/chat/ChatInterface';
import ManualPredictionForm from './components/manual-form/ManualPredictionForm';
import MarketIntelligence from './components/sections/MarketIntelligence';
import HowItWorks from './components/sections/HowItWorks';
import WhyPropGPT from './components/sections/WhyPropGPT';
import Footer from './components/common/Footer';
import { MessageSquare, Calculator, TrendingUp, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('chat');
  const [prefilledChatPrompt, setPrefilledChatPrompt] = useState(null);

  const chatRef = useRef(null);
  const calcRef = useRef(null);
  const marketRef = useRef(null);
  const workflowRef = useRef(null);

  const handleNavigate = (section) => {
    setActiveSection(section);
    if (section === 'chat' && chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'calculator' && calcRef.current) {
      calcRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'market' && marketRef.current) {
      marketRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'workflow' && workflowRef.current) {
      workflowRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHeroPromptSelect = (promptText) => {
    setPrefilledChatPrompt(promptText);
    setActiveSection('chat');
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLocalitySelect = (locality) => {
    setActiveSection('calculator');
    if (calcRef.current) {
      calcRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0B111E',
      color: '#F8FAFC'
    }}>
      {/* Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Viewport */}
      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <HeroSection
          onSelectPrompt={handleHeroPromptSelect}
          onExploreForm={() => handleNavigate('calculator')}
        />

        {/* Section View Switcher / Tabs */}
        <div style={{
          maxWidth: '900px',
          margin: '20px auto 30px',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(20, 28, 46, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <button
              onClick={() => handleNavigate('chat')}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === 'chat' ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' : 'transparent',
                color: activeSection === 'chat' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeSection === 'chat' ? '0 4px 15px rgba(56, 189, 248, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={18} />
              AI Conversational Valuation
            </button>

            <button
              onClick={() => handleNavigate('calculator')}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === 'calculator' ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)' : 'transparent',
                color: activeSection === 'calculator' ? '#FFFFFF' : '#94A3B8',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: activeSection === 'calculator' ? '0 4px 15px rgba(56, 189, 248, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Calculator size={18} />
              Manual Model Form (3-Tab)
            </button>
          </div>
        </div>

        {/* Primary Interactive Interface Container */}
        <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '0 24px' }}>
          {activeSection === 'chat' ? (
            <div ref={chatRef} className="animate-fade-in">
              <ChatInterface prefilledPrompt={prefilledChatPrompt} />
            </div>
          ) : (
            <div ref={calcRef} className="animate-fade-in">
              <ManualPredictionForm />
            </div>
          )}
        </div>

        {/* Market Intelligence Section */}
        <section ref={marketRef} style={{ padding: '60px 24px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '60px' }}>
          <MarketIntelligence onSelectLocality={handleLocalitySelect} />
        </section>

        {/* How It Works Section */}
        <section ref={workflowRef} style={{ padding: '40px 24px 20px' }}>
          <HowItWorks />
        </section>

        {/* Why PropGPT Section */}
        <section style={{ padding: '20px 24px 40px' }}>
          <WhyPropGPT />
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
