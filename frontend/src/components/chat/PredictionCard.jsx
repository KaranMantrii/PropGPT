import React, { useState } from 'react';
import { Check, Copy, Share2, Sparkles, Building, MapPin, Maximize2, ShieldCheck, Info } from 'lucide-react';
import { formatINR, formatPricePerSqFt } from '../../utils/formatters';

export default function PredictionCard({ prediction, propertyDetails, predictionType = 'flat_price' }) {
  const [copied, setCopied] = useState(false);

  const price = (typeof prediction === 'object' && prediction !== null 
    ? (prediction.predicted_price || prediction.price || prediction.prediction || 0) 
    : prediction) || 0;

  const isRent = predictionType === 'rent' || predictionType === 'rental' || predictionType === 'rent_price' || prediction?.prediction_type === 'rent';
  const isHouse = predictionType === 'house_purchase' || predictionType === 'house_price' || predictionType === 'house' || prediction?.prediction_type === 'house_price' || prediction?.prediction_type === 'house_purchase';
  const area = propertyDetails?.area || propertyDetails?.query_area || 0;
  const bhk = propertyDetails?.bhk || propertyDetails?.query_bhk;
  const locality = propertyDetails?.locality || propertyDetails?.query_locality || 'Hyderabad';
  const furnishing = propertyDetails?.furnishing || propertyDetails?.query_Furnishing || propertyDetails?.query_furnishing || 'Semi-Furnished';
  const floor = propertyDetails?.property_floor || propertyDetails?.buy_floor || propertyDetails?.query_buy_floor;

  const handleCopy = () => {
    const text = `PropGPT Valuation: ${formatINR(price, isRent)} (${formatPricePerSqFt(price, area)}) for ${bhk ? `${bhk} BHK ` : ''}property in ${locality}.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(20, 28, 46, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '18px',
      padding: '24px',
      boxShadow: '0 12px 35px -5px rgba(0, 0, 0, 0.5), 0 0 25px rgba(56, 189, 248, 0.15)',
      marginTop: '12px',
      maxWidth: '560px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative top accent glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #38BDF8 0%, #2563EB 50%, #10B981 100%)'
      }} />

      {/* Header Pill & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: isRent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: isRent ? '#34D399' : '#38BDF8',
            border: `1px solid ${isRent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Sparkles size={12} />
            {isRent ? 'Predicted Monthly Rental' : isHouse ? 'Predicted Villa / House Price' : 'Predicted Flat Purchase Price'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          title="Copy valuation details"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '6px 10px',
            color: copied ? '#34D399' : '#94A3B8',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>

      {/* Main Valuation Figure */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
          Estimated Fair Value:
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '34px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            {formatINR(price, isRent)}
          </span>

          {area > 0 && (
            <span style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#38BDF8',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              {formatPricePerSqFt(price, area)}
            </span>
          )}
        </div>
      </div>

      {/* Property Specifications Pill Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '12px',
        borderRadius: '12px',
        background: 'rgba(11, 17, 30, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '16px'
      }}>
        {locality && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0' }}>
            <MapPin size={14} color="#38BDF8" />
            <strong>{locality}</strong>
          </div>
        )}

        {bhk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Building size={14} color="#818CF8" />
            <span>{bhk} BHK</span>
          </div>
        )}

        {area > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#E2E8F0', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Maximize2 size={14} color="#34D399" />
            <span>{area} sq.ft</span>
          </div>
        )}

        {furnishing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <span>{furnishing}</span>
          </div>
        )}

        {floor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <span>Floor {floor}</span>
          </div>
        )}
      </div>

      {/* Confidence & Statutory Disclaimer */}
      <div style={{
        fontSize: '11px',
        lineHeight: 1.4,
        color: '#64748B',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        paddingTop: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px'
      }}>
        <Info size={14} color="#64748B" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          <strong>Disclaimer:</strong> PropGPT provides machine learning-based estimates for informational purposes. Estimates are not certified property valuations or guaranteed transaction quotes.
        </span>
      </div>
    </div>
  );
}
