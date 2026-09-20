import React from 'react';
import { AnalysisResult, BeamProperties, Load, Support, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, formatNum, normalizeBeamSegments } from '../../engine/units';
import { getBeamSectionAt } from '../../engine/beamSolver';
import { ChevronRight } from 'lucide-react';
import { IBeamIcon } from '../Common/IBeamIcon';
import { ShearIcon, MomentIcon, DeflectionIcon, SlopeIcon } from '../Common/EngineeringIcons';

interface CrossSectionInspectorProps {
  xValue: number;
  onChangeX: (val: number) => void;
  beam: BeamProperties;
  supports: Support[];
  loads: Load[];
  result: AnalysisResult;
  unitSystem: UnitSystem;
}

export const CrossSectionInspector: React.FC<CrossSectionInspectorProps> = ({
  xValue,
  onChangeX,
  beam,
  supports,
  loads,
  result,
  unitSystem
}) => {
  const units = UNIT_CONFIGS[unitSystem];
  const { diagramPoints, reactions } = result;
  const segments = normalizeBeamSegments(beam);
  const localSection = getBeamSectionAt(segments, xValue, unitSystem);
  const isNonPrismatic = segments.length > 1 || segments.some((s) => s.isTapered);

  // Calculate exact analytical shear V and moment M at this specific xValue
  const calculateExactValues = (x: number) => {
    let V = 0;
    let M = 0;

    // Reactions strictly <= x
    reactions.forEach((r) => {
      if (r.x <= x + 1e-7) {
        V += r.Fy;
        M += r.Fy * (x - r.x);
        M -= r.M; // fixed reaction moment
      }
    });

    // Applied loads <= x
    loads.forEach((l) => {
      if (l.type === 'point' && l.x <= x + 1e-7) {
        V -= l.magnitude;
        M -= l.magnitude * (x - l.x);
      } else if (l.type === 'moment' && l.x <= x + 1e-7) {
        const sign = l.momentDirection === 'cw' ? 1 : -1;
        M += l.magnitude * sign;
      } else if (l.type === 'udl' || l.type === 'triangular') {
        const lStart = l.x;
        const lEnd = l.xEnd ?? beam.length;
        if (lStart <= x) {
          const activeLen = Math.min(x, lEnd) - lStart;
          if (activeLen > 0) {
            if (l.type === 'udl') {
              const w = l.magnitude;
              const f = w * activeLen;
              const arm = x - (lStart + activeLen / 2);
              V -= f;
              M -= f * arm;
            } else {
              const w1 = l.magnitude;
              const w2 = l.magnitudeEnd ?? 0;
              const totalSpan = Math.max(1e-6, lEnd - lStart);
              const wAtCut = w1 + (w2 - w1) * (activeLen / totalSpan);
              const f = ((w1 + wAtCut) / 2) * activeLen;
              const centroidFromStart = (activeLen * (w1 + 2 * wAtCut)) / (3 * (w1 + wAtCut || 1));
              const arm = x - (lStart + centroidFromStart);
              V -= f;
              M -= f * arm;
            }
          }
        }
      }
    });

    // Clean up near zero
    if (Math.abs(V) < 1e-6) V = 0;
    if (Math.abs(M) < 1e-6) M = 0;

    // Deflection & Slope interpolated from high-resolution diagram points
    let deflection = 0;
    let slope = 0;

    if (diagramPoints && diagramPoints.length > 0) {
      // Find closest point or segment
      let idx = 0;
      while (idx < diagramPoints.length - 1 && diagramPoints[idx + 1].x < x) {
        idx++;
      }
      const p1 = diagramPoints[idx];
      const p2 = diagramPoints[Math.min(diagramPoints.length - 1, idx + 1)];

      if (p1 && p2 && p2.x > p1.x) {
        const ratio = Math.max(0, Math.min(1, (x - p1.x) / (p2.x - p1.x)));
        deflection = p1.deflection + ratio * (p2.deflection - p1.deflection);
        slope = p1.slope + ratio * (p2.slope - p1.slope);
      } else if (p1) {
        deflection = p1.deflection;
        slope = p1.slope;
      }
    }

    return { V, M, deflection, slope };
  };

  const currentValues = calculateExactValues(xValue);

  // Collect key critical locations for Quick-Jump pills
  const jumpPoints: { label: string; x: number }[] = [{ label: 'x = 0', x: 0 }];

  supports.forEach((s) => {
    if (s.x > 0 && s.x < beam.length) {
      jumpPoints.push({ label: `${s.type.toUpperCase()} @ ${s.x}`, x: s.x });
    }
  });

  loads.forEach((l) => {
    if (l.type === 'point' && l.x > 0 && l.x < beam.length) {
      jumpPoints.push({ label: `P @ ${formatNum(l.x, 4)}`, x: l.x });
    } else if (l.type === 'moment' && l.x > 0 && l.x < beam.length) {
      jumpPoints.push({ label: `M @ ${formatNum(l.x, 4)}`, x: l.x });
    }
  });

  result.criticalPoints.forEach((cp) => {
    if (cp.type === 'zero_shear' && cp.x > 0 && cp.x < beam.length) {
      jumpPoints.push({ label: `V=0 @ ${formatNum(cp.x, 4)}`, x: cp.x });
    }
  });

  // Segment transitions for non-prismatic beams
  segments.forEach((seg, sIdx) => {
    if (seg.xStart > 0 && seg.xStart < beam.length) {
      jumpPoints.push({ label: `Segment ${sIdx + 1} @ ${formatNum(seg.xStart, 2)}`, x: seg.xStart });
    }
    if (seg.xEnd > 0 && seg.xEnd < beam.length) {
      jumpPoints.push({ label: `Segment ${sIdx + 1} End @ ${formatNum(seg.xEnd, 2)}`, x: seg.xEnd });
    }
  });

  jumpPoints.push({ label: `x = ${formatNum(beam.length, 4)}`, x: beam.length });

  // Deduplicate jump points by coordinate
  const uniqueJumpPoints = jumpPoints.filter(
    (pt, index, self) => index === self.findIndex((p) => Math.abs(p.x - pt.x) < 0.01)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm space-y-3.5 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs flex-shrink-0">
            <IBeamIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Cross-Section Inspector
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Inspect internal shear, moment, and deflection at any distance x
            </p>
          </div>
        </div>

        {/* Numeric Input for exact x */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700">Location:</span>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-xs font-extrabold text-indigo-600 pointer-events-none">
              x =
            </span>
            <input
              type="number"
              min="0"
              max={beam.length}
              step="0.0001"
              value={Number(xValue.toFixed(4))}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onChangeX(Math.max(0, Math.min(beam.length, val)));
                }
              }}
              className="w-28 sm:w-32 bg-slate-50 hover:bg-white text-xs font-extrabold text-slate-900 border border-indigo-300 rounded-lg pl-9 pr-7 py-1.5 sm:py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all tabular-nums shadow-2xs"
            />
            <span className="absolute right-2.5 text-xs font-bold text-slate-400 pointer-events-none">
              {units.length}
            </span>
          </div>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>0 {units.length}</span>
          <span className="text-indigo-600 font-extrabold tabular-nums text-xs">
            x = {formatNum(xValue, 4)} {units.length}
          </span>
          <span>{beam.length} {units.length}</span>
        </div>
        <input
          type="range"
          min="0"
          max={beam.length}
          step="0.0001"
          value={xValue}
          onChange={(e) => onChangeX(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 touch-manipulation"
        />
      </div>

      {/* Quick Jump Pills to Critical Points */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
          Jump to:
        </span>
        {uniqueJumpPoints.map((pt, i) => {
          const isActive = Math.abs(xValue - pt.x) < 0.0001;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChangeX(pt.x)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {pt.label}
            </button>
          );
        })}
      </div>

      {/* Exact Values Output Dashboard at this x */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
        {/* Shear V(x) */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShearIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate">Shear V(x)</span>
          </span>
          <div className="mt-1 flex items-baseline space-x-1 flex-wrap">
            <span
              className={`text-base sm:text-lg font-black tracking-tight tabular-nums ${
                currentValues.V > 0
                  ? 'text-emerald-600'
                  : currentValues.V < 0
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {currentValues.V > 0 ? '+' : ''}
              {formatNum(currentValues.V, 4)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{units.force}</span>
          </div>
        </div>

        {/* Moment M(x) */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MomentIcon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="truncate">Moment M(x)</span>
          </span>
          <div className="mt-1 flex items-baseline space-x-1 flex-wrap">
            <span
              className={`text-base sm:text-lg font-black tracking-tight tabular-nums ${
                currentValues.M > 0
                  ? 'text-emerald-600'
                  : currentValues.M < 0
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {currentValues.M > 0 ? '+' : ''}
              {formatNum(currentValues.M, 4)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{units.moment}</span>
          </div>
        </div>

        {/* Deflection delta(x) */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <DeflectionIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">Deflection δ(x)</span>
          </span>
          <div className="mt-1 flex items-baseline space-x-1 flex-wrap">
            <span className="text-base sm:text-lg font-black tracking-tight text-amber-700 tabular-nums">
              {formatNum(currentValues.deflection, 4)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{units.deflection}</span>
          </div>
        </div>

        {/* Slope theta(x) */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <SlopeIcon className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
            <span className="truncate">Slope θ(x)</span>
          </span>
          <div className="mt-1 flex items-baseline space-x-1 flex-wrap">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-800 tabular-nums">
              {formatNum(currentValues.slope, 4)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">rad</span>
          </div>
        </div>
      </div>

      {/* Non-Prismatic Rigidity Strip */}
      {isNonPrismatic && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-indigo-950">Non-Prismatic Section @ x = {formatNum(xValue, 4)} {units.length}:</span>
            <span className="text-indigo-800">
              Inertia <span className="font-mono font-bold">{formatNum(localSection.I, 4)}</span> {units.inertia}
            </span>
            <span className="text-indigo-300">|</span>
            <span className="text-indigo-800">
              Modulus <span className="font-mono font-bold">{formatNum(localSection.E, 4)}</span> {units.stress}
            </span>
            <span className="text-indigo-300">|</span>
            <span className="text-indigo-800">
              Rigidity <span className="font-mono font-bold">{formatNum(localSection.EI, 4)}</span> {unitSystem === 'metric' ? 'kN·m²' : 'kip·in²'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
