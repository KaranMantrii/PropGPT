import React from 'react';
import { AlertCircle, MapPinOff } from 'lucide-react';

export default function MapError({ message = 'Unable to load geographical map.', locality }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '16px 20px',
        borderRadius: '12px',
        background: '#171717',
        border: '1px solid #292929',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: '#F5F5F5'
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#EF4444'
        }}
      >
        <MapPinOff size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444' }}>
          Map lookup unavailable {locality ? `for ${locality}` : ''}
        </div>
        <div style={{ fontSize: '12px', color: '#B3B3B3', marginTop: '2px' }}>
          {message} Property price predictions and conversation flow remain fully functional.
        </div>
      </div>
    </div>
  );
}
