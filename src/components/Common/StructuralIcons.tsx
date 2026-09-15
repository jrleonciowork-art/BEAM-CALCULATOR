import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const PinIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="12,4 5,16 19,16" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="5.5" r="1.8" fill="white" stroke="currentColor" strokeWidth="1.6" />
    <line x1="2" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="5" y1="18" x2="2" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="9" y1="18" x2="6" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="13" y1="18" x2="10" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="17" y1="18" x2="14" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="21" y1="18" x2="18" y2="22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const RollerIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="12,3 5,13 19,13" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="12" cy="4.5" r="1.6" fill="white" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8" cy="16.5" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="16" cy="16.5" r="2.2" fill="white" stroke="currentColor" strokeWidth="1.8" />
    <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const FixedIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Wall */}
    <line x1="9" y1="2" x2="9" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Clamped beam */}
    <rect x="9" y="8.5" width="12" height="7" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
    {/* Wall Hatches */}
    <line x1="9" y1="4" x2="3" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="9" y1="9" x2="3" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="9" y1="14" x2="3" y2="19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="9" y1="19" x2="5" y2="22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const HingeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4.5" fill="white" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
  </svg>
);

export const PointDownIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Arrow pointing DOWN */}
    <line x1="12" y1="2" x2="12" y2="17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <polygon points="12,22 6,14 18,14" fill="currentColor" />
  </svg>
);

export const PointUpIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Arrow pointing UP */}
    <line x1="12" y1="22" x2="12" y2="7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <polygon points="12,2 6,10 18,10" fill="currentColor" />
  </svg>
);

export const UdlIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Rectangle box with arrows */}
    <rect x="2" y="3" width="20" height="6" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" rx="1" />
    {/* Downward arrows */}
    <line x1="6" y1="9" x2="6" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polygon points="6,21 3.5,16.5 8.5,16.5" fill="currentColor" />

    <line x1="12" y1="9" x2="12" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polygon points="12,21 9.5,16.5 14.5,16.5" fill="currentColor" />

    <line x1="18" y1="9" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polygon points="18,21 15.5,16.5 20.5,16.5" fill="currentColor" />
  </svg>
);

export const TriangularIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Trapezoid / triangle ramp with arrows */}
    <polygon points="2,12 22,3 22,7 2,12" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <line x1="5" y1="12" x2="5" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <polygon points="5,20 3,16 7,16" fill="currentColor" />

    <line x1="12" y1="9" x2="12" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <polygon points="12,21 9.5,16.5 14.5,16.5" fill="currentColor" />

    <line x1="19" y1="6" x2="19" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <polygon points="19,22 16,16 22,16" fill="currentColor" />
  </svg>
);

export const MomentCwIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Curved arrow rotating clockwise (right-up) */}
    <path
      d="M 6,16 A 8 8 0 1 1 18,14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <polygon points="21,17 15,13 19,10" fill="currentColor" />
  </svg>
);

export const MomentCcwIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Curved arrow rotating counter-clockwise (left-up) */}
    <path
      d="M 18,16 A 8 8 0 1 0 6,14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <polygon points="3,17 9,13 5,10" fill="currentColor" />
  </svg>
);
