import React from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function MapLoading({ locality = 'Property Locality' }) {
  return (
    <div
      style={{
        width: '100%',
        height: '380px',
        borderRadius: '14px',
        background: '#171717',
        border: '1px solid #292929',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: '#F5F5F5',
        padding: '20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'rgba(255, 23, 68, 0.12)',
          border: '1px solid rgba(255, 23, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF1744'
        }}
      >
        <MapPin size={26} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Loader2 size={16} className="animate-spin" color="#FF1744" />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          Locating {locality}...
        </span>
      </div>
      <p style={{ fontSize: '12px', color: '#B3B3B3', maxWidth: '300px' }}>
        Retrieving coordinates and discovering nearby healthcare, education, transport, and recreation facilities.
      </p>
    </div>
  );
}
