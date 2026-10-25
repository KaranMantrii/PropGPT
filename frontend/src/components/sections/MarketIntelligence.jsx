import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, Building2, MapPin, Search } from 'lucide-react';
import { formatNumberIN } from '../../utils/formatters';

const MARKET_DATA = [
  {
    locality: "Kokapet",
    avgFlatRate: 9850,
    avgRent2BHK: 42000,
    yoyGrowth: "+14.8%",
    status: "Ultra-High Growth",
    category: "Luxury Tech Hub",
    description: "Driven by Neopolis SEZ and Outer Ring Road accessibility."
  },
  {
    locality: "Financial District",
    avgFlatRate: 10400,
    avgRent2BHK: 48000,
    yoyGrowth: "+16.2%",
    status: "High Demand",
    category: "Commercial Core",
    description: "Premium walk-to-work demand for global IT giants."
  },
  {
    locality: "Gachibowli",
    avgFlatRate: 8900,
    avgRent2BHK: 38000,
    yoyGrowth: "+11.4%",
    status: "Steady Growth",
    category: "IT Corridor",
    description: "Consistent high occupancy with premium gated communities."
  },
  {
    locality: "Hitech City",
    avgFlatRate: 9200,
    avgRent2BHK: 40000,
    yoyGrowth: "+12.1%",
    status: "High Demand",
    category: "Tech & Retail",
    description: "Metro connectivity and central commercial infrastructure."
  },
  {
    locality: "Kondapur",
    avgFlatRate: 7800,
    avgRent2BHK: 34000,
    yoyGrowth: "+9.6%",
    status: "Active Resale",
    category: "Residential Tech",
    description: "Popular family haven with extensive social infrastructure."
  },
  {
    locality: "Jubilee Hills",
    avgFlatRate: 15500,
    avgRent2BHK: 65000,
    yoyGrowth: "+8.2%",
    status: "Ultra-Luxury",
    category: "High Net Worth",
    description: "Premier independent houses, villas, and boutique luxury flats."
  },
  {
    locality: "Tellapur",
    avgFlatRate: 7200,
    avgRent2BHK: 28000,
    yoyGrowth: "+13.5%",
    status: "Emerging Corridor",
    category: "Suburban Gated",
    description: "Extensive township projects appealing to young IT professionals."
  },
  {
    locality: "Kukatpally",
    avgFlatRate: 6400,
    avgRent2BHK: 24000,
    yoyGrowth: "+7.8%",
    status: "Stable Mature",
    category: "Metro Hub",
    description: "Strong domestic rental demand with direct Red Line metro access."
  }
];

export default function MarketIntelligence({ onSelectLocality }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = MARKET_DATA.filter((item) =>
    item.locality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: '1060px',
      margin: '0 auto',
      padding: '20px 0'
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' }}>
            <TrendingUp size={16} />
            <span>Micro-Market Intelligence</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
            Hyderabad Real Estate Benchmarks
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            Real-time average rates and YoY appreciation rates across major clusters.
          </p>
        </div>

        {/* Filter search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(20, 28, 46, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '8px 14px',
          width: '260px'
        }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            placeholder="Search locality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Grid of Micro-Markets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {filteredData.map((item) => (
          <div
            key={item.locality}
            onClick={() => onSelectLocality && onSelectLocality(item.locality)}
            style={{
              background: 'rgba(20, 28, 46, 0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.25s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {item.locality}
                </h3>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{item.category}</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#34D399',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {item.yoyGrowth} YoY
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Avg Price / Sq.Ft
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38BDF8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ₹ {formatNumberIN(item.avgFlatRate)} <span style={{ fontSize: '12px', fontWeight: 500, color: '#94A3B8' }}>/ sq.ft</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(11, 17, 30, 0.6)',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '12px'
            }}>
              <span style={{ color: '#94A3B8' }}>Est. 2 BHK Rent:</span>
              <strong style={{ color: '#E2E8F0' }}>₹ {formatNumberIN(item.avgRent2BHK)} / mo</strong>
            </div>

            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.4, margin: '0 0 12px' }}>
              {item.description}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#38BDF8',
              fontWeight: 600
            }}>
              <span>Calculate in {item.locality}</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
