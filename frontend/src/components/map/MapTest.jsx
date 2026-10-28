import React from 'react';
import PropertyMap from './PropertyMap';

const sampleMapData = {
  locality: 'Gachibowli',
  center: { lat: 17.4401, lng: 78.3489 },
  radius: 3000,
  amenities: [
    {
      id: 'osm-1',
      name: 'Continental Hospitals',
      category: 'healthcare',
      type: 'hospital',
      lat: 17.4241,
      lng: 78.3409,
      distance_m: 1950
    },
    {
      id: 'osm-2',
      name: 'IIIT Hyderabad',
      category: 'education',
      type: 'university',
      lat: 17.4452,
      lng: 78.3498,
      distance_m: 577
    },
    {
      id: 'osm-3',
      name: 'Raidurg Metro Station',
      category: 'transportation',
      type: 'metro_station',
      lat: 17.4409,
      lng: 78.3764,
      distance_m: 2920
    },
    {
      id: 'osm-4',
      name: 'Ratnadeep Supermarket',
      category: 'shopping',
      type: 'supermarket',
      lat: 17.4431,
      lng: 78.3546,
      distance_m: 690
    },
    {
      id: 'osm-5',
      name: 'GMC Balayogi Athletic Stadium',
      category: 'recreation',
      type: 'sports_centre',
      lat: 17.4470,
      lng: 78.3468,
      distance_m: 800
    }
  ],
  summary: {
    total: 5,
    healthcare: 1,
    education: 1,
    transportation: 1,
    shopping: 1,
    recreation: 1
  }
};

export default function MapTest() {
  return (
    <div style={{ padding: '30px', background: '#080808', minHeight: '100vh' }}>
      <h2 style={{ color: '#F5F5F5', marginBottom: '20px' }}>PropGPT Automatic Map Preview</h2>
      <div style={{ maxWidth: '640px' }}>
        <PropertyMap mapData={sampleMapData} />
      </div>
    </div>
  );
}
