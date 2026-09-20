import React, { useState, useEffect } from 'react';
import { Monitor, X, Check } from 'lucide-react';

export const DeviceNoticeToast: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('beamlab_device_notice_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('beamlab_device_notice_dismissed', 'true');
    } catch {
      // ignore storage error
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-start gap-3 sm:gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
          <Monitor className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-0.5">
            Device Recommendation
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            For the best experience, this calculator is better used on a PC or tablet. Happy solving.
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Got it</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
