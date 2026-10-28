import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
  useMap
} from 'react-leaflet';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';
import AmenityMarkers from './AmenityMarkers';
import MapLegend from './MapLegend';
import MapError from './MapError';
import MapLoading from './MapLoading';

/**
 * Ensures Leaflet recalculates viewport bounds when mounted
 * inside dynamically rendered chat bubbles or resized containers.
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Smoothly repositions and zooms the map view when locality coordinates change.
 */
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && !Number.isNaN(center[0]) && !Number.isNaN(center[1])) {
      map.setView(center, 13.5, { animate: true });
      map.invalidateSize();
    }
  }, [center, map]);
  return null;
}

export default function PropertyMap({ mapData, isLoading = false }) {
  const [activeCategory, setActiveCategory] = useState('all');

  if (isLoading) {
    return <MapLoading locality={mapData?.locality} />;
  }

  if (!mapData || !mapData.center) {
    return <MapError locality={mapData?.locality} message="Geographical coordinates could not be resolved." />;
  }

  const lat = Number(mapData.center.lat);
  const lng = Number(mapData.center.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return <MapError locality={mapData?.locality} message="Invalid latitude or longitude coordinates." />;
  }

  const centerCoords = [lat, lng];
  const radius = Number(mapData.radius) || 3000;
  const amenities = mapData.amenities || [];
  const summary = mapData.summary || {
    total: amenities.length,
    healthcare: amenities.filter((a) => a.category === 'healthcare').length,
    education: amenities.filter((a) => a.category === 'education').length,
    transportation: amenities.filter((a) => a.category === 'transportation').length,
    shopping: amenities.filter((a) => a.category === 'shopping').length,
    recreation: amenities.filter((a) => a.category === 'recreation').length
  };

  return (
    <div
      className="propgpt-map-container"
      style={{
        width: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
        background: '#171717',
        border: '1px solid #292929',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Map Header Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '12px 16px',
          background: '#171717',
          borderBottom: '1px solid #292929'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 23, 68, 0.12)',
              border: '1px solid rgba(255, 23, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF1744'
            }}
          >
            <MapPin size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F5F5F5' }}>
              {mapData.locality}
              <span style={{ fontSize: '11px', fontWeight: 400, color: '#B3B3B3', marginLeft: '6px' }}>
                Micro-Market Map
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#777777' }}>
              Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#FF1744',
              background: 'rgba(255, 23, 68, 0.1)',
              border: '1px solid rgba(255, 23, 68, 0.25)',
              borderRadius: '9999px',
              padding: '3px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Compass size={11} />
            {(radius / 1000).toFixed(0)} km Radius
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#B3B3B3',
              background: '#1C1C1C',
              border: '1px solid #292929',
              borderRadius: '9999px',
              padding: '3px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Layers size={11} />
            {amenities.length} Amenities
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height: '360px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={centerCoords}
          zoom={13.5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#080808' }}
        >
          {/* Official OpenStreetMap Standard Tile Layer (100% Free & Open Source, No API Key Required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="propgpt-osm-tiles"
          />

          {/* 3 km Discovery Radius Circle */}
          <Circle
            center={centerCoords}
            radius={radius}
            pathOptions={{
              color: '#FF1744',
              weight: 1.5,
              dashArray: '5, 6',
              fillColor: '#FF1744',
              fillOpacity: 0.05
            }}
          />

          {/* Locality Center Halo Ring */}
          <CircleMarker
            center={centerCoords}
            radius={18}
            pathOptions={{
              color: '#FF1744',
              weight: 1,
              fillColor: '#FF1744',
              fillOpacity: 0.18
            }}
          />

          {/* Locality Center Point Marker */}
          <CircleMarker
            center={centerCoords}
            radius={8.5}
            pathOptions={{
              color: '#FFFFFF',
              weight: 2,
              fillColor: '#FF1744',
              fillOpacity: 1
            }}
          >
            <Popup className="propgpt-custom-popup">
              <div style={{ fontFamily: "'Inter', sans-serif", color: '#F5F5F5', fontSize: '13px' }}>
                <strong style={{ color: '#FF1744' }}>{mapData.locality}</strong>
                <div style={{ fontSize: '11px', color: '#B3B3B3', marginTop: '2px' }}>
                  Property Center &bull; {(radius / 1000).toFixed(0)} km Search Radius
                </div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Categorized Amenities */}
          <AmenityMarkers amenities={amenities} activeCategory={activeCategory} />

          {/* Viewport Resizer and Auto-Recenter */}
          <MapResizer />
          <MapRecenter center={centerCoords} />
        </MapContainer>
      </div>

      {/* Amenity Category Filter / Legend */}
      <MapLegend
        summary={summary}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />
    </div>
  );
}
