import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mouse } from 'lucide-react';
import { BeamScene } from '../components/3D/BeamScene';

export const LandingPage: React.FC = () => {
  const [liveDeflection, setLiveDeflection] = useState<number>(0);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const navigate = useNavigate();

  // Format real-time live deflection for student visual feedback
  const deflectionMm = (-liveDeflection * 25.4).toFixed(1);
  const isBending = Math.abs(liveDeflection) > 0.05;

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    // Smooth cinematic transition timing into calculator
    setTimeout(() => {
      navigate('/calculator');
    }, 720);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Full-Screen 3D React Three Fiber Canvas Background with Fly-Through Camera */}
      <div className="absolute inset-0 z-0">
        <BeamScene onDeflectionValue={setLiveDeflection} isLaunching={isLaunching} />
      </div>

      {/* 2. Strictly Elevated Content Floating Above the 3D Beam */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-10 sm:pt-14 md:pt-16 px-6 text-center pointer-events-none">
        <div
          className={`max-w-3xl mx-auto flex flex-col items-center transition-all duration-500 ease-out ${
            isLaunching
              ? 'opacity-0 scale-95 -translate-y-5 pointer-events-none'
              : 'opacity-100 scale-100 translate-y-0'
          }`}
        >
          {/* Main Title: B.E.A.M. Calculator */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl">
            B.E.A.M. <span className="text-indigo-400">Calculator</span>
          </h1>

          {/* Subtitle: Bagsak Evasion And Mitigation */}
          <p className="mt-1.5 text-base sm:text-xl md:text-2xl font-bold tracking-wide text-indigo-200 drop-shadow-md">
            (Bagsak Evasion And Mitigation)
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg font-medium leading-relaxed drop-shadow">
            A state-of-the-art 2D beam analysis tool designed for civil and mechanical engineering students.
            100% free, zero sign-ups, and mathematically rigorous.
          </p>

          {/* Centered Launch Calculator Button & Real-Time Deflection HUD (Compact Row) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunching}
              className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-black text-sm sm:text-base tracking-wide transition-all duration-300 group cursor-pointer shadow-xl relative overflow-hidden ${
                isLaunching
                  ? 'bg-indigo-500 text-white scale-105 ring-4 ring-indigo-400/80 shadow-2xl shadow-indigo-500/80 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-600/40 border border-indigo-400/40 hover:shadow-2xl hover:border-indigo-300'
              }`}
            >
              {/* Shimmer light sweep when clicked */}
              {isLaunching && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
              {isLaunching ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Launching System...</span>
                </>
              ) : (
                <>
                  <span>Launch Calculator</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                </>
              )}
            </button>

            {/* Real-Time Live Deflection HUD */}
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs font-semibold tabular-nums text-slate-300 shadow-inner">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  isBending ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <span className="text-slate-400">Elastic Deflection δ:</span>
              <span
                className={`font-bold tabular-nums ${
                  liveDeflection > 0.02
                    ? 'text-rose-400'
                    : liveDeflection < -0.02
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {liveDeflection > 0.02 ? '↓ ' : liveDeflection < -0.02 ? '↑ ' : ''}
                {deflectionMm} mm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Scroll Interaction Hint */}
      <div
        className={`absolute bottom-6 inset-x-0 z-10 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold gap-1.5 drop-shadow transition-opacity duration-300 ${
          isLaunching ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Mouse className="w-4 h-4 text-indigo-400 animate-bounce" />
        <span className="tracking-wide text-[11px] uppercase text-slate-400 font-bold">
          Scroll mouse wheel or drag vertically to flex beam
        </span>
      </div>

      {/* 4. Cinematic Light Curtain Transition into Calculator */}
      <div
        className={`fixed inset-0 bg-slate-50 pointer-events-none z-50 transition-opacity duration-700 ease-in-out ${
          isLaunching ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default LandingPage;
