import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { CATEGORY_CONFIG } from './MapLegend';
import { Navigation } from 'lucide-react';

export default function AmenityMarkers({ amenities = [], activeCategory = 'all' }) {
  if (!amenities || amenities.length === 0) return null;

  const filtered = activeCategory === 'all'
    ? amenities
    : amenities.filter((item) => item.category === activeCategory);

  return (
    <>
      {filtered.map((item, idx) => {
        const catKey = item.category || 'all';
        const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.all;
        const lat = Number(item.lat);
        const lng = Number(item.lng);

        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        return (
          <CircleMarker
            key={item.id || `amenity_${idx}_${lat}_${lng}`}
            center={[lat, lng]}
            radius={6.5}
            pathOptions={{
              color: '#FFFFFF',
              weight: 1.5,
              fillColor: config.color,
              fillOpacity: 0.95
            }}
          >
            <Popup className="propgpt-custom-popup">
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: '#F5F5F5',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
                  minWidth: '180px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '4px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: config.bg,
                      color: config.color,
                      border: `1px solid ${config.border}`
                    }}
                  >
                    {config.label}
                  </span>
                  {item.type && (
                    <span style={{ fontSize: '10.5px', color: '#B3B3B3', textTransform: 'capitalize' }}>
                      {String(item.type).replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: '#F5F5F5',
                    margin: '6px 0 4px'
                  }}
                >
                  {item.name}
                </div>

                {item.distance_m != null && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#FF1744',
                      marginTop: '6px'
                    }}
                  >
                    <Navigation size={11} />
                    <span>
                      {item.distance_m >= 1000
                        ? `${(item.distance_m / 1000).toFixed(2)} km`
                        : `${Math.round(item.distance_m)} m`}{' '}
                      <span style={{ color: '#777777' }}>(straight-line)</span>
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
