import React from 'react';
import { AnalysisResult, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, formatNum } from '../../engine/units';
import { TrendingUp, Activity, CheckCircle2, AlertTriangle, ArrowDownUp } from 'lucide-react';

interface SummaryCardsProps {
  result: AnalysisResult;
  unitSystem: UnitSystem;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ result, unitSystem }) => {
  const units = UNIT_CONFIGS[unitSystem];

  if (!result.isStable) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-rose-900 shadow-xs">
        <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-rose-800">Kinematic Mechanism / Unstable Structure</h3>
          <p className="text-xs text-rose-700 mt-0.5">{result.statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {/* 1. Max Shear Force Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-blue-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
            <ArrowDownUp className="w-3.5 h-3.5" />
            Max Shear |V|
          </span>
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            at x = {formatNum(result.maxAbsShear.x)} {units.length}
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
            {formatNum(result.maxAbsShear.value)}
          </span>
          <span className="text-xs font-bold text-slate-500">{units.force}</span>
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-1 flex justify-between tabular-nums border-t border-slate-100 pt-1">
          <span>Min: {formatNum(result.minShear.value)}</span>
          <span>Max: {formatNum(result.maxShear.value)}</span>
        </div>
      </div>

      {/* 2. Max Bending Moment Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-indigo-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
            <TrendingUp className="w-3.5 h-3.5" />
            Max Moment |M|
          </span>
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            at x = {formatNum(result.maxAbsMoment.x)} {units.length}
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
            {formatNum(result.maxAbsMoment.value)}
          </span>
          <span className="text-xs font-bold text-slate-500">{units.moment}</span>
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-1 flex justify-between tabular-nums border-t border-slate-100 pt-1">
          <span>Min: {formatNum(result.minMoment.value)}</span>
          <span>Max: {formatNum(result.maxMoment.value)}</span>
        </div>
      </div>

      {/* 3. Max Deflection Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-amber-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
            <Activity className="w-3.5 h-3.5" />
            Max Deflection |δ|
          </span>
          <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
            at x = {formatNum(result.maxAbsDeflection.x)} {units.length}
          </span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-black tracking-tight text-slate-900 tabular-nums">
            {formatNum(result.maxAbsDeflection.value)}
          </span>
          <span className="text-xs font-bold text-slate-500">{units.deflection}</span>
        </div>
        <div className="text-[11px] font-medium text-slate-500 mt-1 flex justify-between tabular-nums border-t border-slate-100 pt-1">
          <span>Min: {formatNum(result.minDeflection.value)}</span>
          <span>Max: {formatNum(result.maxDeflection.value)}</span>
        </div>
      </div>

      {/* 4. Equilibrium Balance Check Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Equilibrium Check
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
            BALANCED
          </span>
        </div>
        <div className="space-y-0.5 text-xs text-slate-700 tabular-nums mt-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Σ Fy =</span>
            <span className="text-emerald-700 font-bold">
              {formatNum(result.equilibriumCheck.sumFy, 4)} {units.force}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Σ M =</span>
            <span className="text-emerald-700 font-bold">
              {formatNum(result.equilibriumCheck.sumM, 4)} {units.moment}
            </span>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 mt-1 truncate border-t border-slate-100 pt-1">
          {result.isDeterminate ? 'Statically Determinate' : `Indeterminate Degree ${result.degreeOfIndeterminacy}`}
        </div>
      </div>
    </div>
  );
};
