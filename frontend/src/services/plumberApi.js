/**
 * PropGPT Plumber API Service
 * Centralized API client connecting React frontend to the R Plumber backend (:8000)
 */

import { getPreferences } from './chatStorage.js';

export function getApiBaseUrl(override) {
  return (override || import.meta.env?.VITE_PLUMBER_API_URL || getPreferences().backendUrl || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

// Accept older Plumber servers as well as the scalar JSON contract.
export function normalizeApiResponse(data) {
  const scalarKeys = new Set(['status', 'service', 'reply', 'message', 'prediction', 'predicted_price',
    'prediction_type', 'intent', 'error', 'details', 'success', 'prediction_success', 'ready_for_prediction', 'session_id',
    'area', 'bhk', 'locality', 'furnishing', 'transaction', 'area_source', 'bathroom', 'balcony',
    'ownership', 'facing', 'buy_floor', 'total_floors', 'currency', 'period',
    'lat', 'lng', 'radius', 'name', 'category', 'type', 'distance_m', 'id',
    'total', 'healthcare', 'education', 'transportation', 'shopping', 'recreation', 'display_name']);
  function visit(value, key) {
    if (Array.isArray(value)) {
      if (scalarKeys.has(key) && value.length === 1) return visit(value[0], key);
      return value.map(item => visit(item));
    }
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v, k)]));
    return value;
  }
  return visit(data);
}

async function request(path, options = {}, override) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), path === '/chat' ? 195000 : 20000);
  try {
    const baseUrl = getApiBaseUrl(override);
    let res;
    try {
      res = await fetch(`${baseUrl}${path}`, { ...options, signal: controller.signal });
    } catch (fetchErr) {
      // If direct fetch fails (e.g. CORS policy or network resolution error)
      // and no explicit override was passed, retry using the same-origin relative path (Vite proxy)
      if (fetchErr instanceof TypeError && baseUrl && !override && typeof window !== 'undefined') {
        try {
          res = await fetch(path, { ...options, signal: controller.signal });
        } catch {
          throw fetchErr;
        }
      } else {
        throw fetchErr;
      }
    }
    const data = normalizeApiResponse(await res.json());
    if (!res.ok) throw new Error(data.error || data.reply || 'The request could not be completed. Please try again.');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The valuation service took too long to respond. Please try again.');
    if (err instanceof TypeError) throw new Error('Cannot connect to the valuation service. Check the backend connection in Settings.');
    throw err;
  } finally { clearTimeout(timer); }
}

export async function checkHealth(override) {
  try {
    return await request('/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }, override);
  } catch (err) {
    console.warn("Backend /health check error:", err.message);
    return { status: "offline", error: err.message };
  }
}

export async function predictFlat(payload) {
  const body = {
    session_id: payload.session_id,
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_Furnishing: payload.furnishing || "Semi-Furnished",
    query_Transaction: payload.transaction || "Resale",
    query_area_source: payload.area_source || "Super",
    query_Bathroom: payload.bathrooms != null ? Number(payload.bathrooms) : null,
    query_Balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : null
  };

  return request('/predict/flat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

}

export async function predictHouse(payload) {
  const body = {
    session_id: payload.session_id,
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_furnishing: payload.furnishing || "Semi-Furnished",
    query_area_source: payload.area_source || "Super",
    query_transaction: payload.transaction || "Resale",
    query_bathroom: payload.bathrooms != null ? Number(payload.bathrooms) : null,
    query_balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : 1,
    query_ownership: payload.ownership || "Freehold",
    query_facing: payload.facing || "East",
    query_buy_floor: payload.property_floor !== undefined ? Number(payload.property_floor) : 1,
    query_total_floors: payload.total_floors !== undefined ? Number(payload.total_floors) : 2
  };

  return request('/predict/house', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

}

export async function predictRent(payload) {
  const body = {
    session_id: payload.session_id,
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_furnishing: payload.furnishing || "Semi-Furnished",
    query_area_source: payload.area_source || "Super",
    query_bathroom: payload.bathrooms != null ? Number(payload.bathrooms) : null,
    query_balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : 1,
    query_buy_floor: payload.property_floor !== undefined ? Number(payload.property_floor) : 3,
    query_total_floors: payload.total_floors !== undefined ? Number(payload.total_floors) : 5
  };

  return request('/predict/rent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

}

export async function sendChatMessage(sessionId, message) {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message: message
    })
  });

}
