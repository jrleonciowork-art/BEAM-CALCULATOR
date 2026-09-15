import React from 'react';

/**
 * Shear Force (V) Icon:
 * Depicts opposing vertical shear forces acting across a vertical section plane.
 */
export const ShearIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Left Face: Upward Shear Force */}
    <line x1="7" y1="19" x2="7" y2="5" />
    <polyline points="4 8 7 5 10 8" />
    {/* Right Face: Downward Shear Force */}
    <line x1="17" y1="5" x2="17" y2="19" />
    <polyline points="14 16 17 19 20 16" />
    {/* Central Vertical Section Cut (dashed) */}
    <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2" strokeWidth="1.5" strokeOpacity="0.4" />
  </svg>
);

/**
 * Bending Moment (M) Icon:
 * Depicts a curved rotational bending moment / torque vector.
 */
export const MomentIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Rotational Moment Arc */}
    <path d="M 20 13 A 8 8 0 1 1 17.5 7.5" />
    <polyline points="18 3 17.5 7.5 13 7.5" />
  </svg>
);

/**
 * Deflection (d / ?) Icon:
 * Depicts the initial horizontal beam datum, the downward sagging elastic curve,
 * and the central vertical displacement vector.
 */
export const DeflectionIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Undeflected Horizontal Axis (dashed reference) */}
    <line x1="3" y1="5" x2="21" y2="5" strokeDasharray="2.5 2" strokeWidth="1.5" strokeOpacity="0.45" />
    {/* Sagging Elastic Deflection Curve */}
    <path d="M 3 5 C 7 21, 17 21, 21 5" strokeWidth="2.2" />
    {/* Central Downward Displacement Arrow */}
    <line x1="12" y1="5" x2="12" y2="17" strokeWidth="1.8" />
    <polyline points="9.5 13.5 12 17 14.5 13.5" strokeWidth="1.8" />
  </svg>
);

/**
 * Slope (?) Icon:
 * Depicts the horizontal baseline, inclined tangent to the elastic curve,
 * and the rotation angle arc ?.
 */
export const SlopeIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Horizontal Datum Line */}
    <line x1="4" y1="19" x2="20" y2="19" />
    {/* Inclined Tangent Line */}
    <line x1="4" y1="19" x2="19" y2="7" />
    {/* Angle Arc ? */}
    <path d="M 13 19 A 9 9 0 0 0 11 13.4" strokeWidth="1.8" />
  </svg>
);
