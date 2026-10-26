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
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#CBD5E1',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <ArrowLeft size={14} />
          <span>Modify Property Parameters</span>
        </button>

        <span style={{ fontSize: '11px', color: '#64748B' }}>
          Estimated by {isRent || isHouse ? 'Ranger Random Forest' : 'XGBoost'}
        </span>
      </div>

      {/* Main Glassmorphic Valuation Card */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(20, 28, 46, 0.95) 0%, rgba(13, 19, 32, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Top Accent Glow */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #38BDF8 0%, #6366F1 50%, #A855F7 100%)'
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
              background: isRent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.18)',
              color: isRent ? '#34D399' : '#C0C1FF',
              border: `1px solid ${isRent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.35)'}`,
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: copied ? '#34D399' : '#CBD5E1',
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
          <div style={{ fontSize: '13px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Model Estimated Fair Market Value
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '44px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              {formattedPrice}
            </span>

            {area > 0 && (
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
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
          background: 'rgba(11, 17, 30, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFFFFF' }}>
            <MapPin size={15} color="#38BDF8" />
            <strong>{formData.locality}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFFFFF', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
            <Building size={15} color="#A855F7" />
            <span>{formData.bhk} BHK</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#FFFFFF', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
            <Maximize2 size={15} color="#34D399" />
            <span>{area} sq.ft</span>
          </div>

          {formData.furnishing && (
            <div style={{ fontSize: '13px', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              {formData.furnishing}
            </div>
          )}

          {!isRent && formData.transaction && (
            <div style={{ fontSize: '13px', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              {formData.transaction}
            </div>
          )}

          {(isHouse || isRent) && formData.property_floor != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
              <Layers size={14} />
              <span>Floor {formData.property_floor}{formData.total_floors ? `/${formData.total_floors}` : ''}</span>
            </div>
          )}

          {isHouse && formData.facing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#CBD5E1', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
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
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Property locality</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', marginTop: '4px' }}>{formData.locality}</div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Zero Hallucination</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#34D399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} />
              <span>Strict ML Computation</span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase' }}>Market Context</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#38BDF8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} />
              <span>Ask AI for listing comparisons</span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px' }}>This model estimate is not a certified appraisal or guaranteed transaction price. Actual prices vary with condition, amenities and negotiations.</p>
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
              cursor: 'pointer'
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
