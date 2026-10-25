import React from 'react';
import { Sparkles, MapPin, ArrowRight, ShieldCheck, Zap, TrendingUp, Cpu } from 'lucide-react';

const SUGGESTIONS = [
  {
    title: "Kokapet Luxury Flat",
    query: "I want to buy a 3 BHK flat in Kokapet around 1800 sq ft",
    desc: "Super built-up, premium high-rise",
    badge: "Trending"
  },
  {
    title: "Gachibowli Tech Corridor",
    query: "2 BHK Rental in Gachibowli 1250 sq ft furnished near Financial District",
    desc: "Monthly rent estimation with furnishing",
    badge: "High Demand"
  },
  {
    title: "Jubilee Hills Villa",
    query: "4 BHK Independent House in Jubilee Hills 3500 sq ft freehold",
    desc: "Independent villa purchase valuation",
    badge: "Luxury"
  },
  {
    title: "Kukatpally Family Home",
    query: "Looking for a 2 BHK flat in Kukatpally resale 1150 sq ft",
    desc: "Budget-friendly residential cluster",
    badge: "Resale"
  }
];

export default function HeroSection({ onSelectPrompt, onExploreForm }) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '60px 24px 40px',
      overflow: 'hidden'
    }}>
      {/* Background Image Layer with Luxury Dark Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/images/skyline-poster.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        zIndex: 0,
        opacity: 0.28,
        filter: 'saturate(1.2) contrast(1.1)'
      }} />

      {/* Atmospheric Navy Gradient Layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 50% 30%, rgba(14, 22, 38, 0.4) 0%, rgba(11, 17, 30, 0.95) 75%, #0B111E 100%)',
        zIndex: 1
      }} />

      {/* Hero Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '920px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Geographic Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          marginBottom: '20px'
        }}>
          <MapPin size={14} color="#38BDF8" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Hyderabad Real Estate Intelligence
          </span>
          <span style={{
            fontSize: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34D399',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 700
          }}>
            ML Live
          </span>
        </div>

        {/* Master Heading */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          marginBottom: '18px'
        }}>
          Smarter Property Valuations for <br />
          <span className="text-gradient">Hyderabad Real Estate</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: '#94A3B8',
          maxWidth: '680px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Powered by dedicated machine learning models trained on 10,000+ verified transactions across Flats, Independent Houses, and Rentals in 2,000+ localities.
        </p>

        {/* Metric Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}>
          <div className="glass-pill" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={14} color="#38BDF8" />
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>3 Specialized ML Models</span>
          </div>
          <div className="glass-pill" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={14} color="#818CF8" />
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>2,000+ Micro-markets</span>
          </div>
          <div className="glass-pill" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} color="#FBBF24" />
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>Sub-100ms Inference</span>
          </div>
          <div className="glass-pill" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} color="#34D399" />
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>Zero Broker Bias</span>
          </div>
        </div>

        {/* 4 Clickable Suggestion Prompt Cards */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#38BDF8" />
            <span>Popular Property Queries (Click to Run):</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px'
          }}>
            {SUGGESTIONS.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectPrompt(item.query)}
                style={{
                  background: 'rgba(20, 28, 46, 0.75)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(56, 189, 248, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                    {item.title}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    fontWeight: 600
                  }}>
                    {item.badge}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>
                  {item.desc}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#38BDF8',
                  marginTop: '10px',
                  fontWeight: 600
                }}>
                  <span>Query AI</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
