import React from 'react';
import {
  Activity,
  GraduationCap,
  Bus,
  ShoppingBag,
  Trees,
  Layers
} from 'lucide-react';

export const CATEGORY_CONFIG = {
  all: {
    label: 'All Amenities',
    color: '#FF1744',
    bg: 'rgba(255, 23, 68, 0.12)',
    border: 'rgba(255, 23, 68, 0.35)',
    icon: Layers
  },
  healthcare: {
    label: 'Healthcare',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: Activity
  },
  education: {
    label: 'Education',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.3)',
    icon: GraduationCap
  },
  transportation: {
    label: 'Transport',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: Bus
  },
  shopping: {
    label: 'Shopping',
    color: '#22C55E',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.3)',
    icon: ShoppingBag
  },
  recreation: {
    label: 'Recreation',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
    icon: Trees
  }
};

export default function MapLegend({
  summary = {},
  activeCategory = 'all',
  onSelectCategory
}) {
  const categories = ['all', 'healthcare', 'education', 'transportation', 'shopping', 'recreation'];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 12px',
        background: '#171717',
        borderTop: '1px solid #292929',
        borderBottomLeftRadius: '14px',
        borderBottomRightRadius: '14px'
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#777777',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginRight: '4px'
        }}
      >
        Filter:
      </span>

      {categories.map((catKey) => {
        const config = CATEGORY_CONFIG[catKey];
        const IconComponent = config.icon;
        const count = catKey === 'all' ? summary.total || 0 : summary[catKey] || 0;
        const isActive = activeCategory === catKey;

        return (
          <button
            key={catKey}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(catKey)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '6px',
              border: isActive
                ? `1px solid ${config.color}`
                : '1px solid #292929',
              background: isActive
                ? config.bg
                : '#1C1C1C',
              color: isActive ? config.color : '#B3B3B3',
              fontSize: '11.5px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: config.color,
                display: 'inline-block'
              }}
            />
            <IconComponent size={12} />
            <span>{config.label}</span>
            {count > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  opacity: 0.85,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  marginLeft: '2px'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
