import React, { useState } from 'react';
import {
  Building, Home, Key, AlertTriangle, Sparkles,
  RefreshCw, MessageSquare, ShieldCheck, ArrowRight
} from 'lucide-react';
import { FEATURED_LOCALITIES, LOCALITIES } from '../../constants/localities';
import { predictFlat, predictHouse, predictRent } from '../../services/plumberApi';
import PredictionResultPanel from './PredictionResultPanel';

export default function ManualPredictionForm({ onAskAiInstead }) {
  const [activeTab, setActiveTab] = useState('flat'); // 'flat' | 'house' | 'rent'

  // Form State
  const [formData, setFormData] = useState({
    locality: 'Kokapet',
    area: 1650,
    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    furnishing: 'Semi-Furnished',
    area_source: 'Super',
    transaction: 'Resale',
    ownership: 'Freehold',
    facing: 'East',
    property_floor: 5,
    total_floors: 14
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setError(null);
    // Sensible defaults tailored per tab
    if (tab === 'house') {
      setFormData((prev) => ({
        ...prev,
        area: 2800,
        bhk: 4,
        property_floor: 1,
        total_floors: 2
      }));
    } else if (tab === 'rent') {
      setFormData((prev) => ({
        ...prev,
        area: 1350,
        bhk: 2,
        property_floor: 4,
        total_floors: 10
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        area: 1650,
        bhk: 3
      }));
    }
  };

  const handleClear = () => {
    setError(null);
    setResult(null);
    if (activeTab === 'house') {
      setFormData({
        locality: 'Kokapet',
        area: 2400,
        bhk: 3,
        bathrooms: 3,
        balconies: 1,
        furnishing: 'Semi-Furnished',
        area_source: 'Super',
        transaction: 'Resale',
        ownership: 'Freehold',
        facing: 'East',
        property_floor: 1,
        total_floors: 2
      });
    } else if (activeTab === 'rent') {
      setFormData({
        locality: 'Gachibowli',
        area: 1200,
        bhk: 2,
        bathrooms: 2,
        balconies: 1,
        furnishing: 'Semi-Furnished',
        area_source: 'Super',
        transaction: 'Resale',
        ownership: 'Freehold',
        facing: 'East',
        property_floor: 3,
        total_floors: 8
      });
    } else {
      setFormData({
        locality: 'Kokapet',
        area: 1500,
        bhk: 3,
        bathrooms: 2,
        balconies: 1,
        furnishing: 'Semi-Furnished',
        area_source: 'Super',
        transaction: 'Resale',
        ownership: 'Freehold',
        facing: 'East',
        property_floor: 4,
        total_floors: 12
      });
    }
  };

  const handleAskAi = () => {
    if (onAskAiInstead) {
      const typeStr = activeTab === 'rent' ? 'rental flat' : activeTab === 'house' ? 'independent house' : 'flat';
      const prompt = `I want to evaluate a ${formData.bhk} BHK ${typeStr} in ${formData.locality} around ${formData.area} sq ft (${formData.furnishing || 'semi-furnished'}, ${formData.transaction || 'resale'}). What is the estimated price and micro-market analysis?`;
      onAskAiInstead(prompt);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.locality) {
      setError("Please select a valid Hyderabad locality.");
      setLoading(false);
      return;
    }

    if (!formData.area || formData.area <= 100) {
      setError("Area must be greater than 100 sq.ft.");
      setLoading(false);
      return;
    }

    try {
      let response;
      const payload = { ...formData, session_id: `manual_${crypto.randomUUID()}` };
      if (activeTab === 'flat') {
        response = await predictFlat(payload);
      } else if (activeTab === 'house') {
        response = await predictHouse(payload);
      } else {
        response = await predictRent(payload);
      }
      setResult(response);
    } catch (err) {
      console.warn("Manual prediction failed:", err);
      setResult(null);
      setError(err.message || 'Unable to generate an estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If result is present, display PredictionResultPanel
  if (result) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <PredictionResultPanel
          result={result}
          formData={formData}
          activeTab={activeTab}
          onModifyInputs={() => setResult(null)}
          onAskAiAboutResult={onAskAiInstead}
        />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '860px',
      margin: '0 auto',
      padding: '24px 16px 80px'
    }}>
      {/* Top Banner explaining zero-hallucination ML */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        borderRadius: '16px',
        background: 'rgba(20, 28, 46, 0.75)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        backdropFilter: 'blur(16px)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C0C1FF'
          }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
              Deterministic Machine Learning Valuation
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Valuations are computed strictly by trained XGBoost and Ranger Random Forest models. Zero price fabrication.
            </div>
          </div>
        </div>

        <button
          onClick={handleAskAi}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#38BDF8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <MessageSquare size={13} />
          <span>Ask AI Instead</span>
        </button>
      </div>

      {/* Main Form Container */}
      <div style={{
        background: 'rgba(13, 19, 32, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* 3-Tab Segmented Switcher */}
        <div className="manual-type-tabs" style={{
          display: 'flex',
          background: 'rgba(11, 17, 30, 0.8)',
          padding: '5px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '28px'
        }}>
          <button
            type="button"
            onClick={() => handleTabChange('flat')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              background: activeTab === 'flat' ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' : 'transparent',
              color: activeTab === 'flat' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'flat' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Building size={16} />
            <span>Flat Purchase (XGBoost)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('house')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              background: activeTab === 'house' ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' : 'transparent',
              color: activeTab === 'house' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'house' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Home size={16} />
            <span>Independent House / Villa</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('rent')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              background: activeTab === 'rent' ? 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)' : 'transparent',
              color: activeTab === 'rent' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'rent' ? '0 4px 15px rgba(99, 102, 241, 0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Key size={16} />
            <span>Residential Rental</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#FCA5A5',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={16} color="#EF4444" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            {/* Column 1: Location & Dimensions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Locality Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                  Hyderabad Locality <span style={{ color: '#F43F5E' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={formData.locality}
                    onChange={(e) => handleInputChange('locality', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <optgroup label="Featured High-Velocity Corridors">
                      {FEATURED_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </optgroup>
                    <optgroup label="All Registered Localities">
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Area in Sq.Ft */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>
                    Built-up Area (Sq.Ft) <span style={{ color: '#F43F5E' }}>*</span>
                  </label>
                  <span style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 600 }}>
                    {formData.area} sq.ft
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="200"
                    max="15000"
                    step="50"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* BHK Selection Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                  Bedrooms (BHK) <span style={{ color: '#F43F5E' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((bhkNum) => (
                    <button
                      key={bhkNum}
                      type="button"
                      onClick={() => handleInputChange('bhk', bhkNum)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: formData.bhk === bhkNum ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: formData.bhk === bhkNum ? 'rgba(99, 102, 241, 0.2)' : 'rgba(11, 17, 30, 0.8)',
                        color: formData.bhk === bhkNum ? '#FFFFFF' : '#94A3B8',
                        fontWeight: formData.bhk === bhkNum ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {bhkNum} {bhkNum >= 5 ? '+' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms and Balconies */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Bathrooms
                  </label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>{num} Bathroom{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Balconies
                  </label>
                  <select
                    value={formData.balconies}
                    onChange={(e) => handleInputChange('balconies', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {[0, 1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>{num} Balcon{num === 1 ? 'y' : 'ies'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Specifications, Finishes & Floors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Furnishing Status */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                  Furnishing Status
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Unfurnished', 'Semi-Furnished', 'Furnished'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleInputChange('furnishing', f)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border: formData.furnishing === f ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: formData.furnishing === f ? 'rgba(56, 189, 248, 0.15)' : 'rgba(11, 17, 30, 0.8)',
                        color: formData.furnishing === f ? '#FFFFFF' : '#94A3B8',
                        fontWeight: formData.furnishing === f ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction & Area Source (for Flat and House) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Transaction Type
                  </label>
                  <select
                    value={formData.transaction}
                    onChange={(e) => handleInputChange('transaction', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="Resale">Resale</option>
                    <option value="New Property">New Property</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Area Source
                  </label>
                  <select
                    value={formData.area_source}
                    onChange={(e) => handleInputChange('area_source', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(11, 17, 30, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="Super">Super Built-up</option>
                    <option value="Carpet">Carpet Area</option>
                  </select>
                </div>
              </div>

              {/* House specific: Facing & Ownership */}
              {activeTab === 'house' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                      Facing Direction
                    </label>
                    <select
                      value={formData.facing}
                      onChange={(e) => handleInputChange('facing', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'rgba(11, 17, 30, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      {['East', 'North', 'West', 'South', 'North-East', 'North-West'].map(dir => (
                        <option key={dir} value={dir}>{dir}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                      Ownership
                    </label>
                    <select
                      value={formData.ownership}
                      onChange={(e) => handleInputChange('ownership', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'rgba(11, 17, 30, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="Freehold">Freehold</option>
                      <option value="Leasehold">Leasehold</option>
                      <option value="Power of Attorney">Power of Attorney</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Floor Details (for Flat & Rent) */}
              {(activeTab === 'house' || activeTab === 'rent') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                      Property Floor
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.property_floor}
                      onChange={(e) => handleInputChange('property_floor', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'rgba(11, 17, 30, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                      Total Floors
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.total_floors}
                      onChange={(e) => handleInputChange('total_floors', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'rgba(11, 17, 30, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 20px',
                color: '#94A3B8',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '13px 28px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Calculating Model Fair Value...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Predict Property Price</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
