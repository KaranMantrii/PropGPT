/**
 * PropGPT Plumber API Service
 * Centralized API client connecting React frontend to the R Plumber backend (:8000)
 */

const API_BASE_URL = import.meta.env.VITE_PLUMBER_API_URL || 'http://127.0.0.1:8000';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend /health check error:", err.message);
    return { status: "offline", error: err.message };
  }
}

export async function predictFlat(payload) {
  const body = {
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_Furnishing: payload.furnishing || "Semi-Furnished",
    query_Transaction: payload.transaction || "Resale",
    query_area_source: payload.area_source || "Super",
    query_Bathroom: payload.bathrooms ? Number(payload.bathrooms) : null,
    query_Balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : null
  };

  const res = await fetch(`${API_BASE_URL}/predict/flat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details || "Flat price estimation failed.");
  }
  return data;
}

export async function predictHouse(payload) {
  const body = {
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_furnishing: payload.furnishing || "Semi-Furnished",
    query_area_source: payload.area_source || "Super",
    query_transaction: payload.transaction || "Resale",
    query_bathroom: payload.bathrooms ? Number(payload.bathrooms) : 2,
    query_balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : 1,
    query_ownership: payload.ownership || "Freehold",
    query_facing: payload.facing || "East",
    query_buy_floor: payload.property_floor !== undefined ? Number(payload.property_floor) : 1,
    query_total_floors: payload.total_floors !== undefined ? Number(payload.total_floors) : 2
  };

  const res = await fetch(`${API_BASE_URL}/predict/house`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details || "House price estimation failed.");
  }
  return data;
}

export async function predictRent(payload) {
  const body = {
    query_area: Number(payload.area),
    query_bhk: Number(payload.bhk),
    query_locality: payload.locality,
    query_furnishing: payload.furnishing || "Semi-Furnished",
    query_area_source: payload.area_source || "Super",
    query_bathroom: payload.bathrooms ? Number(payload.bathrooms) : 2,
    query_balcony: payload.balconies !== undefined && payload.balconies !== null ? Number(payload.balconies) : 1,
    query_buy_floor: payload.property_floor !== undefined ? Number(payload.property_floor) : 3,
    query_total_floors: payload.total_floors !== undefined ? Number(payload.total_floors) : 5
  };

  const res = await fetch(`${API_BASE_URL}/predict/rent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.details || "Rent estimation failed.");
  }
  return data;
}

export async function sendChatMessage(sessionId, message) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message: message
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Unable to process conversation.");
  }
  return data;
}
