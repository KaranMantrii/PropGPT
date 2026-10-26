/**
 * PropGPT Formatting Utilities
 * Standardized financial and real estate metric formatters
 */

import { getPreferences } from '../services/chatStorage.js';

export function parsePriceToNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;

  const str = String(value).trim();
  if (!str) return 0;

  // Check for Cr / Crore
  const crMatch = str.match(/([0-9.]+)\s*(?:cr|crore)/i);
  if (crMatch) {
    return parseFloat(crMatch[1]) * 10000000;
  }

  // Check for Lac / Lakh
  const lacMatch = str.match(/([0-9.]+)\s*(?:lac|lakh|l)/i);
  if (lacMatch) {
    return parseFloat(lacMatch[1]) * 100000;
  }

  // Clean currency symbols, commas
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatINR(value, isRent = false) {
  if (value === null || value === undefined) {
    return "₹ --";
  }

  const num = parsePriceToNumber(value);
  if (!num || isNaN(num)) {
    // If it's already a non-empty string with currency, return clean
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.startsWith('₹') ? value : `₹ ${value}`;
    }
    return "₹ --";
  }

  if (isRent) {
    return `₹ ${Math.round(num).toLocaleString('en-IN')} / mo`;
  }
  if (getPreferences().currencyDisplay === 'standard') return `₹ ${Math.round(num).toLocaleString('en-IN')}`;

  if (num >= 10000000) {
    const cr = num / 10000000;
    return `₹ ${cr.toFixed(2)} Cr`;
  } else if (num >= 100000) {
    const lac = num / 100000;
    return `₹ ${lac.toFixed(2)} Lakh`;
  } else {
    return `₹ ${Math.round(num).toLocaleString('en-IN')}`;
  }
}

export function formatPricePerSqFt(price, area) {
  const numPrice = parsePriceToNumber(price);
  const numArea = Number(area);

  if (!numPrice || !numArea || isNaN(numPrice) || isNaN(numArea) || numArea <= 0) {
    return "₹ -- / sq.ft";
  }
  const ppsf = Math.round(numPrice / numArea);
  return `₹ ${ppsf.toLocaleString('en-IN')} / sq.ft`;
}

export function formatNumberIN(num) {
  if (num === null || num === undefined || isNaN(num)) return "--";
  return Number(num).toLocaleString('en-IN');
}
