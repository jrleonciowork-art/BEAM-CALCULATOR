import React, { useState } from 'react';
import { Load, LoadType, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, formatNum } from '../../engine/units';
import {
  PointDownIcon,
  PointUpIcon,
  UdlIcon,
  TriangularIcon,
  MomentCwIcon,
  MomentCcwIcon
} from '../Common/StructuralIcons';
import { Tooltip } from '../Common/Tooltip';
import { Plus, Trash2, Weight } from 'lucide-react';

interface LoadsManagerProps {
  loads: Load[];
  beamLength: number;
  unitSystem: UnitSystem;
  onAddLoad: (load: Load) => void;
  onRemoveLoad: (id: string) => void;
}

type LoadCategory =
  | 'point_down'
  | 'point_up'
  | 'udl'
  | 'triangular'
  | 'moment_cw'
  | 'moment_ccw';

const LOAD_DEFINITIONS: Record<
  LoadCategory,
  {
    title: string;
    description: string;
    badge: string;
    type: LoadType;
    icon: React.ReactNode;
  }
> = {
  point_down: {
    title: 'Downward Point Load',
    description: 'Downward Point Load: Force acting down.',
    badge: 'Force [F]',
    type: 'point',
    icon: <PointDownIcon className="w-5 h-5 text-rose-600" />
  },
  point_up: {
    title: 'Upward Point Load',
    description: 'Upward Point Load: Force acting up.',
    badge: 'Force [F]',
    type: 'point',
    icon: <PointUpIcon className="w-5 h-5 text-emerald-600" />
  },
  udl: {
    title: 'Uniform Load (UDL)',
    description: 'Uniformly Distributed Load (UDL): Constant pressure.',
    badge: 'w [F/L]',
    type: 'udl',
    icon: <UdlIcon className="w-5 h-5 text-blue-600" />
  },
  triangular: {
    title: 'Linear Load (Varying UDL)',
    description: 'Linearly Varying Load (Varying UDL): Triangular or trap pressure.',
    badge: 'w₁ → w₂',
    type: 'triangular',
    icon: <TriangularIcon className="w-5 h-5 text-indigo-600" />
  },
  moment_cw: {
    title: 'Clockwise Moment (CW)',
    description: 'Clockwise Moment: Apply rotational force (positive in standard sign convention).',
    badge: 'M [F·L]',
    type: 'moment',
    icon: <MomentCwIcon className="w-5 h-5 text-amber-600" />
  },
  moment_ccw: {
    title: 'Counter-Clockwise Moment (CCW)',
    description: 'Counter-Clockwise Moment: Apply rotational force (negative in standard sign convention).',
    badge: 'M [F·L]',
    type: 'moment',
    icon: <MomentCcwIcon className="w-5 h-5 text-violet-600" />
  }
};

export const LoadsManager: React.FC<LoadsManagerProps> = ({
  loads,
  beamLength,
  unitSystem,
  onAddLoad,
  onRemoveLoad
}) => {
  const units = UNIT_CONFIGS[unitSystem];
  const [selectedCat, setSelectedCat] = useState<LoadCategory>('point_down');

  // Input states
  const [x, setX] = useState<number>(beamLength / 2);
  const [xEnd, setXEnd] = useState<number>(beamLength);
  const [mag1, setMag1] = useState<number>(20);
  const [mag2, setMag2] = useState<number>(0);

  const currentDef = LOAD_DEFINITIONS[selectedCat];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();

    const newLoad: Load = {
      id: `load_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: currentDef.type,
      x: Number(x),
      magnitude: Math.abs(mag1)
    };

    if (selectedCat === 'point_down') {
      newLoad.magnitude = Math.abs(mag1); // positive = downward
    } else if (selectedCat === 'point_up') {
      newLoad.magnitude = -Math.abs(mag1); // negative = upward
    } else if (selectedCat === 'udl') {
      newLoad.xEnd = Math.max(x + 0.1, Number(xEnd));
      newLoad.magnitude = Math.abs(mag1);
    } else if (selectedCat === 'triangular') {
      newLoad.xEnd = Math.max(x + 0.1, Number(xEnd));
      newLoad.magnitude = Math.abs(mag1);
      newLoad.magnitudeEnd = Math.abs(mag2);
    } else if (selectedCat === 'moment_cw') {
      newLoad.momentDirection = 'cw';
    } else if (selectedCat === 'moment_ccw') {
      newLoad.momentDirection = 'ccw';
    }

    onAddLoad(newLoad);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Weight className="w-3.5 h-3.5 text-rose-600" />
          Applied Loads & Moments
        </label>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {loads.length} Placed
        </span>
      </div>

      {/* Structural Engineering Icon Grid for Loads */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 mb-1.5">
          Select Load or Moment to Apply:
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {(
            [
              'point_down',
              'point_up',
              'udl',
              'triangular',
              'moment_cw',
              'moment_ccw'
            ] as LoadCategory[]
          ).map((cat) => {
            const def = LOAD_DEFINITIONS[cat];
            const isSelected = selectedCat === cat;

            return (
              <Tooltip
                key={cat}
                position="top"
                content={{
                  title: def.title,
                  description: def.description,
                  badge: def.badge
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`w-full h-12 rounded-xl flex items-center justify-center p-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {def.icon}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Active Selected Type Banner */}
      <div className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            {currentDef.icon}
          </div>
          <span>{currentDef.title}</span>
        </div>
        <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
          {currentDef.badge}
        </span>
      </div>

      {/* Parameter Inputs Form */}
      <form onSubmit={handleAdd} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
        {/* Magnitude & Location */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
              {currentDef.type === 'moment'
                ? 'Moment Magnitude'
                : currentDef.type === 'triangular'
                ? 'Start w₁'
                : 'Force Magnitude'}
            </span>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                value={mag1}
                onChange={(e) => setMag1(parseFloat(e.target.value) || 0)}
                className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-500"
              />
              <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                {currentDef.type === 'moment' ? units.moment : currentDef.type === 'point' ? units.force : units.distLoad}
              </span>
            </div>
          </div>

          {currentDef.type === 'triangular' ? (
            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
                End w2
              </span>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={mag2}
                  onChange={(e) => setMag2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-500"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                  {units.distLoad}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
                Location x
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={beamLength}
                  step="0.0001"
                  value={x}
                  onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-500"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                  {units.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Distributed Span Inputs */}
        {(currentDef.type === 'udl' || currentDef.type === 'triangular') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
                Span Start x1
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={beamLength}
                  step="0.0001"
                  value={x}
                  onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-500"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                  {units.length}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-600 block mb-0.5">
                Span End x2
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={beamLength}
                  step="0.0001"
                  value={xEnd}
                  onChange={(e) => setXEnd(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-2.5 py-1.5 outline-none focus:border-indigo-500"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400 pointer-events-none">
                  {units.length}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Apply to Beam</span>
        </button>
      </form>

      {/* List of Placed Loads */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
        {loads.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No loads applied. Select an icon above to add a load or moment.
          </div>
        ) : (
          loads
            .sort((a, b) => a.x - b.x)
            .map((load) => {
              let title = '';
              let detail = '';

              if (load.type === 'point') {
                const isDown = load.magnitude >= 0;
                title = `${formatNum(Math.abs(load.magnitude), 4)} ${units.force} ${isDown ? 'Downward Point Load ↓' : 'Upward Point Load ↑'}`;
                detail = `at x = ${formatNum(load.x, 4)} ${units.length}`;
              } else if (load.type === 'udl') {
                title = `${formatNum(load.magnitude, 4)} ${units.distLoad} Uniform Load (UDL) ↓`;
                detail = `from x = ${formatNum(load.x, 4)} to ${formatNum(load.xEnd ?? beamLength, 4)} ${units.length}`;
              } else if (load.type === 'triangular') {
                title = `${formatNum(load.magnitude, 4)} → ${formatNum(load.magnitudeEnd ?? 0, 4)} ${units.distLoad} Linear Load`;
                detail = `from x = ${formatNum(load.x, 4)} to ${formatNum(load.xEnd ?? beamLength, 4)} ${units.length}`;
              } else if (load.type === 'moment') {
                const isCw = load.momentDirection === 'cw';
                title = `${formatNum(load.magnitude, 4)} ${units.moment} ${isCw ? 'Clockwise Moment (CW) ↻' : 'Counter-Clockwise Moment (CCW) ↺'}`;
                detail = `at x = ${formatNum(load.x, 4)} ${units.length}`;
              }

              return (
                <div
                  key={load.id}
                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800">{title}</span>
                    <div className="text-[11px] font-semibold text-slate-500">{detail}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveLoad(load.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Remove load"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
