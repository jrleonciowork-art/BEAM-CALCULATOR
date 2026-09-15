import React, { useState } from 'react';

interface TooltipProps {
  content: {
    title: string;
    description: string;
    badge?: string;
  };
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'right' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Position placement classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
    }
  };

  return (
    <div
      className="relative inline-flex items-center justify-center w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none w-56 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700/80 animate-tooltip ${getPositionClasses()}`}
        >
          {/* Arrow indicator */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />

          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs font-bold text-white leading-tight">
              {content.title}
            </span>
            {content.badge && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded uppercase">
                {content.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300 font-normal">
            {content.description}
          </p>
        </div>
      )}
    </div>
  );
};
