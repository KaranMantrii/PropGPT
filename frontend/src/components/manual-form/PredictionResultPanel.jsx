import React, { useState } from 'react';
import { 
  Building, Home, Key, MapPin, Maximize2, ShieldCheck, 
  Sparkles, Check, Copy, MessageSquare, ArrowLeft, RefreshCw,
  TrendingUp, Layers, Compass
} from 'lucide-react';
import { formatINR, formatPricePerSqFt } from '../../utils/formatters';

export default function PredictionResultPanel({
  result,
  formData,
  activeTab, // 'flat' | 'house' | 'rent'
  onModifyInputs,
  onAskAiAboutResult
}) {
  const [copied, setCopied] = useState(false);

  const price = (typeof result === 'object' && result !== null 
    ? (result.predicted_price || result.price || result.prediction || 0) 
    : result) || 0;

  const isRent = activeTab === 'rent' || result?.prediction_type === 'rent';
  const isHouse = activeTab === 'house' || result?.prediction_type === 'house_price';
  const area = formData.area || 0;
  const formattedPrice = formatINR(price, isRent);
  const formattedRate = formatPricePerSqFt(price, area);

  const handleCopy = () => {
    const summary = `PropGPT Valuation: ${formattedPrice} (${formattedRate}) for ${formData.bhk} BHK property in ${formData.locality}, Hyderabad.`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAi = () => {
    if (onAskAiAboutResult) {
      const prompt = result.session_id
        ? 'Please explain the previous manual valuation using its saved property details and available listing evidence. Keep the same estimate and do not change any property details.'
        : `Estimate and explain a ${formData.bhk} BHK ${isRent ? 'rental' : isHouse ? 'house' : 'flat'} in ${formData.locality}, ${area} sq ft, ${formData.furnishing}, ${formData.area_source} area, ${formData.transaction}, ${formData.bathrooms} bathrooms, ${formData.balconies} balconies. Please use the model and available listing evidence.`;
      onAskAiAboutResult(prompt, { backendSessionId: result.session_id });
    }
  };

  return (
    <div style={{
      maxWidth: '780px',
      margin: '0 auto',
      animation: 'fadeIn 0.3s ease-out forwards'
    }}>
      {/* Top Breadcrumb / Return action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onModifyInputs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#1C1C1C',
            border: '1px solid #292929',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#B3B3B3',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#F5F5F5';
            e.currentTarget.style.background = '#292929';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#B3B3B3';
            e.currentTarget.style.background = '#1C1C1C';
          }}
        >
          <ArrowLeft size={14} />
          <span>Modify Property Parameters</span>
        </button>

        <span style={{ fontSize: '11px', color: '#777777' }}>
          Estimated by {isRent || isHouse ? 'Ranger Random Forest' : 'XGBoost'}
        </span>
      </div>

      {/* Main Valuation Card */}
      <div style={{
        background: '#171717',
        border: '1px solid #292929',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Accent Glow (Crimson -> Ruby -> Burgundy) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #FF1744 0%, #B00035 50%, #6A003F 100%)'
        }} />

        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: isRent ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 23, 68, 0.12)',
              color: isRent ? '#22C55E' : '#FF1744',
              border: `1px solid ${isRent ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 23, 68, 0.3)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={13} />
              {isRent ? 'Predicted Monthly Rental' : isHouse ? 'Predicted Villa / House Price' : 'Predicted Flat Purchase Price'}
            </span>
          </div>

          <button
            onClick={handleCopy}
            style={{
              background: '#1C1C1C',
              border: '1px solid #292929',
              borderRadius: '8px',
              padding: '6px 12px',
              color: copied ? '#22C55E' : '#B3B3B3',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Share Valuation'}</span>
          </button>
        </div>

        {/* Valuation Hero Figure */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#B3B3B3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Model Estimated Fair Market Value
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '44px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#F5F5F5',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              {formattedPrice}
            </span>

            {area > 0 && (
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#F5F5F5',
                background: '#1C1C1C',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #292929',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                {formattedRate}
              </span>
            )}
          </div>
        </div>

        {/* Parameter Badges Strip */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '14px 16px',
          borderRadius: '14px',
          background: '#1C1C1C',
          border: '1px solid #292929',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#F5F5F5' }}>
            <MapPin size={15} color="#FF1744" />
            <strong>{formData.locality}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#F5F5F5', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
            <Building size={15} color="#B00035" />
            <span>{formData.bhk} BHK</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#F5F5F5', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
            <Maximize2 size={15} color="#22C55E" />
            <span>{area} sq.ft</span>
          </div>

          {formData.furnishing && (
            <div style={{ fontSize: '13px', color: '#B3B3B3', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
              {formData.furnishing}
            </div>
          )}

          {!isRent && formData.transaction && (
            <div style={{ fontSize: '13px', color: '#B3B3B3', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
              {formData.transaction}
            </div>
          )}

          {(isHouse || isRent) && formData.property_floor != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#B3B3B3', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
              <Layers size={14} />
              <span>Floor {formData.property_floor}{formData.total_floors ? `/${formData.total_floors}` : ''}</span>
            </div>
          )}

          {isHouse && formData.facing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#B3B3B3', borderLeft: '1px solid #292929', paddingLeft: '10px' }}>
              <Compass size={14} />
              <span>{formData.facing} Facing</span>
            </div>
          )}
        </div>

        {/* Micro-market Analysis Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '26px'
        }}>
          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#1C1C1C',
            border: '1px solid #292929'
          }}>
            <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>Property locality</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginTop: '4px' }}>{formData.locality}</div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#1C1C1C',
            border: '1px solid #292929'
          }}>
            <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>Zero Hallucination</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} />
              <span>Strict ML Computation</span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: '#1C1C1C',
            border: '1px solid #292929'
          }}>
            <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>Market Context</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} />
              <span>Ask AI for listing comparisons</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <p style={{ color: '#777777', fontSize: '12px', marginBottom: '16px' }}>This model estimate is not a certified appraisal or guaranteed transaction price. Actual prices vary with condition, amenities and negotiations.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleAskAi}
            className="btn-gradient"
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '12px 20px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={16} />
            <span>Ask AI About This Valuation</span>
          </button>

          <button
            onClick={onModifyInputs}
            className="btn-glass"
            style={{
              padding: '12px 20px',
              fontSize: '13px',
              borderRadius: '12px',
              cursor: 'pointer',
              background: '#1C1C1C',
              border: '1px solid #292929',
              color: '#F5F5F5'
            }}
          >
            <RefreshCw size={15} />
            <span>Modify Inputs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
