import React from 'react';
import { MessageSquareText, Cpu, CheckCheck, TrendingUp, Layers } from 'lucide-react';

const STEPS = [
  {
    step: "01",
    title: "Express Your Needs",
    desc: "Type naturally into our AI Chat (e.g. '3 BHK in Kokapet 1800 sq ft') or use our precision 3-Tab manual valuation form.",
    icon: MessageSquareText,
    accent: "#38BDF8"
  },
  {
    step: "02",
    title: "Slot Normalization",
    desc: "Our orchestrator extracts entities, maps to standard Hyderabad localities, and reconciles built-up vs carpet square footage.",
    icon: Cpu,
    accent: "#2563EB"
  },
  {
    step: "03",
    title: "ML Model Inference",
    desc: "Dispatches the payload to our live R Plumber API serving independent trained XGBoost and Random Forest regression models.",
    icon: TrendingUp,
    accent: "#818CF8"
  },
  {
    step: "04",
    title: "Transparent Valuation",
    desc: "Receive an instantaneous fair value estimate formatted in ₹ Lakhs or Crores alongside accurate ₹/sq.ft metrics.",
    icon: CheckCheck,
    accent: "#10B981"
  }
];

export default function HowItWorks() {
  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#38BDF8',
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px'
        }}>
          <Layers size={14} />
          <span>System Workflow</span>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>
          How PropGPT Calculates Fair Property Values
        </h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '600px', margin: '0 auto' }}>
          From natural language input to multi-model statistical inference in milliseconds.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {STEPS.map((s, idx) => {
          const IconComp = s.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(20, 28, 46, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '18px',
                padding: '24px 20px',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                fontSize: '24px',
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.05)',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                {s.step}
              </div>

              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `rgba(${s.accent === '#38BDF8' ? '56, 189, 248' : s.accent === '#2563EB' ? '37, 99, 235' : s.accent === '#818CF8' ? '129, 140, 248' : '16, 185, 129'}, 0.15)`,
                border: `1px solid ${s.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <IconComp size={22} color={s.accent} />
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
