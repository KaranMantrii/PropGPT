import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiResponse } from '../src/services/plumberApi.js';

test('normalizeApiResponse preserves map object, unboxes scalar coordinates and summary while keeping amenities as an array', () => {
  const rawResponse = {
    reply: ['I have identified Gachibowli as your property locality.'],
    intent: ['flat_purchase'],
    ready_for_prediction: [false],
    prediction_success: [false],
    map: {
      locality: ['Gachibowli'],
      display_name: ['Gachibowli, Serilingampalle mandal, Hyderabad'],
      center: {
        lat: [17.4401],
        lng: [78.3489]
      },
      boundingbox: [17.42, 17.46, 78.32, 78.36],
      radius: [3000],
      amenities: [
        {
          id: ['osm-node-1'],
          name: ['Continental Hospitals'],
          category: ['healthcare'],
          type: ['hospital'],
          lat: [17.4241],
          lng: [78.3409],
          distance_m: [1950]
        },
        {
          id: ['osm-node-2'],
          name: ['IIIT Hyderabad'],
          category: ['education'],
          type: ['university'],
          lat: [17.4452],
          lng: [78.3498],
          distance_m: [577]
        }
      ],
      summary: {
        total: [2],
        healthcare: [1],
        education: [1],
        transportation: [0],
        shopping: [0],
        recreation: [0]
      }
    }
  };

  const normalized = normalizeApiResponse(rawResponse);

  assert.equal(normalized.reply, 'I have identified Gachibowli as your property locality.');
  assert.equal(normalized.ready_for_prediction, false);
  assert.ok(normalized.map, 'map should be present');
  assert.equal(normalized.map.locality, 'Gachibowli');
  assert.equal(normalized.map.center.lat, 17.4401);
  assert.equal(normalized.map.center.lng, 78.3489);
  assert.equal(normalized.map.radius, 3000);
  assert.equal(Array.isArray(normalized.map.boundingbox), true);
  assert.equal(normalized.map.boundingbox.length, 4);
  assert.equal(Array.isArray(normalized.map.amenities), true);
  assert.equal(normalized.map.amenities.length, 2);
  assert.equal(normalized.map.amenities[0].name, 'Continental Hospitals');
  assert.equal(normalized.map.amenities[0].distance_m, 1950);
  assert.equal(normalized.map.amenities[0].category, 'healthcare');
  assert.equal(normalized.map.summary.total, 2);
  assert.equal(normalized.map.summary.healthcare, 1);
});

test('normalizeApiResponse safely handles null map when map lookup is absent or fails', () => {
  const responseWithoutMap = normalizeApiResponse({
    reply: ['Please specify your property area.'],
    map: null
  });

  assert.equal(responseWithoutMap.map, null);
  assert.equal(responseWithoutMap.reply, 'Please specify your property area.');
});

