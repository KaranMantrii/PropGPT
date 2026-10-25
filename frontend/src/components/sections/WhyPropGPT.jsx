import React from 'react';
import { ShieldAlert, Database, Lock, Clock, Award, CheckCircle } from 'lucide-react';

const REASONS = [
  {
    title: "Ground-Truth Transaction Data",
    desc: "Unlike listing portals filled with inflated asking quotes and phantom inventory, PropGPT models are trained on real transaction data across 2,000+ Hyderabad localities.",
    icon: Database
  },
  {
    title: "Zero Broker or Commission Bias",
    desc: "Unbiased statistical evaluation without agent commissions, hidden fees, or builder marketing pressures.",
    icon: Lock
  },
  {
    title: "Strict ML Boundary Architecture",
    desc: "The conversational AI never hallucinates prices; predictions are computed deterministically by verified R Plumber backend regression pipelines.",
    icon: Award
  },
  {
    title: "Instant Sub-Second Inferences",
    desc: "Make swift buying, selling, or leasing decisions with instant valuations across Flats, Independent Houses, and Rentals.",
    icon: Clock
  }
];

export default function WhyPropGPT() {
  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '40px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
          Why Trust PropGPT for Hyderabad Valuations?
        </h2>
        <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '640px', margin: '0 auto' }}>
          Engineered to give homebuyers, investors, and tenants transparent property pricing intelligence.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {REASONS.map((r, idx) => {
          const IconComp = r.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(20, 28, 46, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconComp size={20} color="#38BDF8" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {r.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', lineHeight: 1.5, margin: 0 }}>
                {r.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
