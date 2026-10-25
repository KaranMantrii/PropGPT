import React from 'react';
import { Building2, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(11, 17, 30, 0.95)',
      padding: '40px 24px 30px',
      marginTop: '60px'
    }}>
      <div style={{
        maxWidth: '1060px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Brand & Attribution */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={18} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                Prop<span style={{ color: '#38BDF8' }}>GPT</span>
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '8px' }}>
                Hyderabad Real Estate Intelligence Engine
              </span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            Built with React, Vite &amp; R Plumber ML Backend (:8000)
          </div>
        </div>

        {/* Mandatory Statutory Disclaimer Card */}
        <div style={{
          background: 'rgba(20, 28, 46, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '12px',
          color: '#94A3B8',
          lineHeight: 1.6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E2E8F0', fontWeight: 700, marginBottom: '4px' }}>
            <Shield size={14} color="#F59E0B" />
            <span>Mandatory Real Estate Statutory Disclaimer</span>
          </div>
          <p style={{ margin: 0 }}>
            PropGPT provides machine learning-based price estimates for informational purposes only. These estimates are generated using statistical patterns from historical transaction datasets and are not certified legal valuations, formal bank appraisals, or guaranteed real estate transaction prices. Actual market value varies with exact builder specification, floor rise, interior quality, and mutual agreement between buyer and seller.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748B',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px'
        }}>
          <div>
            &copy; 2026 PropGPT. All rights reserved. Hyderabad, Telangana, India.
          </div>
          <div>
            Serving Kokapet &bull; HITEC City &bull; Gachibowli &bull; Jubilee Hills &bull; Kondapur &bull; 2,000+ Localities
          </div>
        </div>
      </div>
    </footer>
  );
}
