import React, { useState } from 'react';
import {
  Check, Copy, Sparkles, Building, MapPin, Maximize2,
  TrendingUp, ShieldCheck, MessageSquare, Layers, Compass
} from 'lucide-react';
import { formatINR, formatPricePerSqFt } from '../../utils/formatters';

export default function PredictionCard({
  prediction,
  propertyDetails,
  predictionType = 'flat_price',
  onAskAiAboutValuation
}) {
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
  const transaction = propertyDetails?.transaction || propertyDetails?.query_Transaction || propertyDetails?.query_transaction || 'Resale';
  const floor = propertyDetails?.property_floor ?? propertyDetails?.buy_floor ?? propertyDetails?.query_buy_floor;
  const totalFloors = propertyDetails?.total_floors || propertyDetails?.query_total_floors;

  // Formatting strings
  const formattedPrice = formatINR(price, isRent);
  const formattedRate = formatPricePerSqFt(price, area);

  const handleCopy = () => {
    const text = `PropGPT model estimate: ${formattedPrice} (${formattedRate}) for ${bhk ? `${bhk} BHK ` : ''}property in ${locality}. This is not a certified appraisal.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAi = () => {
    if (onAskAiAboutValuation) {
      onAskAiAboutValuation(`Can you explain the previous estimate for this ${bhk ? `${bhk} BHK ` : ''}${locality} property valued at ${formattedPrice}, using the saved details and available listing evidence?`);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(20, 28, 46, 0.95) 0%, rgba(13, 19, 32, 0.95) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.35)',
      borderRadius: '20px',
      padding: '22px',
      boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.18)',
      marginTop: '14px',
      maxWidth: '580px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #38BDF8 0%, #6366F1 50%, #A855F7 100%)'
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
            background: isRent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.18)',
            color: isRent ? '#34D399' : '#C0C1FF',
            border: `1px solid ${isRent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.35)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Sparkles size={12} />
            {isRent ? 'Predicted Monthly Rental' : isHouse ? 'Predicted Villa / House Price' : 'Predicted Flat Purchase Price'}
          </span>
          <span style={{
            fontSize: '10px',
            color: '#64748B',
            fontFamily: 'monospace'
          }}>
            {isRent || isHouse ? 'Ranger RF' : 'XGBoost ML'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          title="Copy valuation details"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '5px 10px',
            color: copied ? '#34D399' : '#94A3B8',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s'
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Main Valuation Figure */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Estimated Fair Market Value
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
            {formattedPrice}
          </span>

          {area > 0 && (
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#38BDF8',
              background: 'rgba(56, 189, 248, 0.12)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              {formattedRate}
            </span>
          )}
        </div>
      </div>

      {/* Property Specifications Pill Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '12px',
        background: 'rgba(11, 17, 30, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '16px'
      }}>
        {locality && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#E2E8F0' }}>
            <MapPin size={13} color="#38BDF8" />
            <strong>{locality}</strong>
          </div>
        )}

        {bhk && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#E2E8F0', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Building size={13} color="#A855F7" />
            <span>{bhk} BHK</span>
          </div>
        )}

        {area > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#E2E8F0', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Maximize2 size={13} color="#34D399" />
            <span>{area} sq.ft</span>
          </div>
        )}

        {furnishing && (
          <div style={{ fontSize: '12px', color: '#94A3B8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            {furnishing}
          </div>
        )}

        {!isRent && transaction && (
          <div style={{ fontSize: '12px', color: '#94A3B8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            {transaction}
          </div>
        )}

        {(isHouse || isRent) && floor != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
            <Layers size={12} />
            <span>Floor {floor}{totalFloors ? `/${totalFloors}` : ''}</span>
          </div>
        )}
      </div>

      {/* Micro-Market & Confidence Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '14px',
        fontSize: '11px'
      }}>
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ color: '#64748B' }}>Micro-Market</div>
          <div style={{ color: '#E2E8F0', fontWeight: 600, marginTop: '2px' }}>{locality}</div>
        </div>
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ color: '#64748B' }}>Estimate source</div>
          <div style={{ color: '#34D399', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} />
            <span>Trained model</span>
          </div>
        </div>
        <div style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ color: '#64748B' }}>Confidence interval</div>
          <div style={{ color: '#38BDF8', fontWeight: 600, marginTop: '2px' }}>Not provided</div>
        </div>
      </div>

      {/* Action Footer: Ask AI about this valuation */}
      <p style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '12px' }}>Model estimate, not a guaranteed transaction price. Actual prices vary with condition, amenities and negotiations.</p>
      {onAskAiAboutValuation && (
        <button
          onClick={handleAskAi}
          style={{
            width: '100%',
            padding: '9px 14px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#C0C1FF',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
            e.currentTarget.style.color = '#C0C1FF';
          }}
        >
          <MessageSquare size={14} />
          <span>Ask AI to analyze this valuation & micro-market trends</span>
        </button>
      )}
    </div>
  );
}
