import React from 'react';
import { 
  Building, Building2, Home, Key, Sparkles, 
  ArrowUpRight, TrendingUp, ShieldCheck 
} from 'lucide-react';

const SUGGESTION_CARDS = [
  {
    title: "3 BHK Flat in Kokapet 1800 sqft",
    tag: "Flat Purchase",
    description: "Estimate a flat purchase price and review available comparable listings.",
    metric: "Ask for an estimate",
    corridor: "Kokapet",
    icon: Building,
    prompt: "I want to evaluate a 3 BHK flat in Kokapet around 1800 sq ft, resale property"
  },
  {
    title: "2 BHK Flat in Kukatpally Resale 1200 sqft",
    tag: "Resale Yield",
    description: "Value a resale flat using its area, bedrooms and available property details.",
    metric: "Ask for an estimate",
    corridor: "Kukatpally",
    icon: Building2,
    prompt: "Estimate price of a 2 BHK flat in Kukatpally resale 1200 sq ft semi-furnished"
  },
  {
    title: "4 BHK Independent Villa in Jubilee Hills 3200 sqft",
    tag: "Luxury Corridor",
    description: "Estimate an independent house purchase price with the house valuation model.",
    metric: "Ask for an estimate",
    corridor: "Jubilee Hills",
    icon: Home,
    prompt: "What is the valuation of a 4 BHK independent house in Jubilee Hills 3200 sq ft?"
  },
  {
    title: "2 BHK Rental in Gachibowli Furnished 1350 sqft",
    tag: "IT Corridor Rental",
    description: "Estimate monthly rent and compare advertised rental listings where available.",
    metric: "Ask for monthly rent",
    corridor: "Gachibowli",
    icon: Key,
    prompt: "Looking for 2 BHK rental in Gachibowli furnished 1350 sq ft monthly rent estimate"
  }
];

export default function ChatHomeEmptyState({ onSelectPrompt }) {
  return (
    <div style={{
      maxWidth: '820px',
      margin: '0 auto',
      padding: '24px 16px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      userSelect: 'none'
    }}>
      {/* Top Status Pill */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 14px',
        borderRadius: '9999px',
        background: '#171717',
        border: '1px solid #292929',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        marginBottom: '22px'
      }}>
        <Sparkles size={14} color="#FF1744" />
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#F5F5F5' }}>
          PropGPT Hyderabad Real Estate Engine
        </span>
        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#777777' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF1744' }}>
          Flats · Houses · Rentals
        </span>
      </div>

      {/* Emblem / Ring */}
      <div style={{ position: 'relative', marginBottom: '18px' }}>
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #FF1744 0%, #B00035 50%, #6A003F 100%)',
          filter: 'blur(22px)',
          opacity: 0.28
        }} />
        <div style={{
          position: 'relative',
          width: '68px',
          height: '68px',
          borderRadius: '20px',
          background: '#171717',
          border: '1px solid #292929',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)'
        }}>
          <Building2 size={32} color="#FF1744" />
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF1744 0%, #B00035 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(255, 23, 68, 0.5)'
          }}>
            <Sparkles size={13} color="#FFFFFF" />
          </div>
        </div>
      </div>

      {/* Main Headline */}
      <h1 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '28px',
        fontWeight: 800,
        letterSpacing: '-0.025em',
        lineHeight: 1.25,
        color: '#F5F5F5',
        maxWidth: '640px',
        marginBottom: '10px'
      }}>
        What <span className="shimmer-text">Hyderabad property</span> would you like to value today?
      </h1>

      {/* Subtext */}
      <p style={{
        fontSize: '14px',
        color: '#B3B3B3',
        maxWidth: '560px',
        lineHeight: 1.6,
        marginBottom: '26px'
      }}>
        Describe a property by text or voice. PropGPT uses trained models for estimates and listing datasets for market context.
      </p>

      {/* 2x2 Bento Suggestion Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '14px',
        width: '100%',
        textAlign: 'left'
      }}>
        {SUGGESTION_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectPrompt(card.prompt)}
              className="glass-card-interactive"
              style={{
                padding: '16px 18px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#171717',
                border: '1px solid #292929'
              }}
            >
              {/* Subtle top edge accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 23, 68, 0.25), transparent)'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(255, 23, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FF1744'
                    }}>
                      <Icon size={16} />
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: '#1C1C1C',
                      color: '#B3B3B3',
                      border: '1px solid #292929'
                    }}>
                      {card.tag}
                    </span>
                  </div>
                  <ArrowUpRight size={15} color="#777777" />
                </div>

                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#F5F5F5',
                  marginBottom: '6px'
                }}>
                  {card.title}
                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#B3B3B3',
                  lineHeight: 1.45,
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>

              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #292929',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                <span style={{ color: '#777777', fontFamily: 'monospace' }}>
                  {card.corridor}
                </span>
                <span style={{ color: '#FF1744', fontWeight: 600 }}>
                  {card.metric}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
