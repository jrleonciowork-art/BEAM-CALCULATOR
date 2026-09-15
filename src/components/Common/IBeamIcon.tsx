import React from 'react';

interface IBeamIconProps {
  className?: string;
}

/**
 * Clean, scalable SVG icon of a structural steel I-beam (wide-flange) cross-section.
 */
export const IBeamIcon: React.FC<IBeamIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      className={className}
    >
      {/* Structural I-Beam Cross Section */}
      <path d="M 4 3.5 H 20 V 7 H 14 V 17 H 20 V 20.5 H 4 V 17 H 10 V 7 H 4 Z" />
    </svg>
  );
};

export default IBeamIcon;
