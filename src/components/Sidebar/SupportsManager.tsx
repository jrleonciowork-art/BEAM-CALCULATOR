import React, { useState } from 'react';
import { Support, SupportType, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, formatNum } from '../../engine/units';
import { PinIcon, RollerIcon, FixedIcon, HingeIcon } from '../Common/StructuralIcons';
import { Tooltip } from '../Common/Tooltip';
import { Plus, Trash2, Shield } from 'lucide-react';

interface SupportsManagerProps {
  supports: Support[];
  beamLength: number;
  unitSystem: UnitSystem;
  onAddSupport: (support: Support) => void;
  onRemoveSupport: (id: string) => void;
}

const SUPPORT_DEFINITIONS: Record<
  SupportType,
  {
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  pin: {
    title: 'Pinned Support',
    description: 'Restricts vertical movement (v = 0). Allows rotation.',
    badge: 'v = 0',
    icon: <PinIcon className="w-6 h-6 text-emerald-600" />
  },
  roller: {
    title: 'Roller Support',
    description: 'Restricts vertical movement (v = 0). Allows horizontal translation.',
    badge: 'v = 0',
    icon: <RollerIcon className="w-6 h-6 text-blue-600" />
  },
  fixed: {
    title: 'Fixed Support',
    description: 'Restrains both vertical movement and rotation (v = 0, θ = 0).',
    badge: 'v = 0, θ = 0',
    icon: <FixedIcon className="w-6 h-6 text-indigo-600" />
  },
  hinge: {
    title: 'Internal Hinge',
    description: 'Allows slope discontinuity (M = 0). Transmits zero bending moment.',
    badge: 'M = 0',
    icon: <HingeIcon className="w-6 h-6 text-amber-600" />
  }
};

export const SupportsManager: React.FC<SupportsManagerProps> = ({
  supports,
  beamLength,
  unitSystem,
  onAddSupport,
  onRemoveSupport
}) => {
  const units = UNIT_CONFIGS[unitSystem];
  const [selectedType, setSelectedType] = useState<SupportType>('roller');
  const [positionX, setPositionX] = useState<number>(beamLength);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (positionX < 0 || positionX > beamLength) return;

    const newSupport: Support = {
      id: `supp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: selectedType,
      x: Number(positionX)
    };
    onAddSupport(newSupport);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          Supports & Hinges
        </label>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {supports.length} Placed
        </span>
      </div>

      {/* Structural Engineering Icon Grid */}
      <div>
        <div className="text-[11px] font-medium text-slate-500 mb-1.5">
          Select Boundary Constraint:
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(['pin', 'roller', 'fixed', 'hinge'] as SupportType[]).map((type) => {
            const def = SUPPORT_DEFINITIONS[type];
            const isSelected = selectedType === type;

            return (
              <Tooltip
                key={type}
                position="top"
                content={{
                  title: def.title,
                  description: def.description,
                  badge: def.badge
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`w-full h-14 rounded-xl flex flex-col items-center justify-center p-1.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center">
                    {def.icon}
                  </div>
                  <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                    {def.title.split(' ')[0]}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Inline Location Input & Add */}
      <form onSubmit={handleAdd} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-2.5 top-2 text-[11px] font-medium text-slate-400">
            x =
          </span>
          <input
            type="number"
            min="0"
            max={beamLength}
            step="0.0001"
            value={positionX}
            onChange={(e) => setPositionX(parseFloat(e.target.value) || 0)}
            className="w-full bg-white text-xs font-bold text-slate-800 border border-slate-300 rounded-md pl-8 pr-7 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
          <span className="absolute right-2.5 top-2 text-[11px] font-semibold text-slate-500 pointer-events-none">
            {units.length}
          </span>
        </div>

        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </form>

      {/* List of Placed Supports */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
        {supports.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
            No supports added. Beam is unrestrained.
          </div>
        ) : (
          supports
            .sort((a, b) => a.x - b.x)
            .map((s) => {
              const def = SUPPORT_DEFINITIONS[s.type];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 flex items-center justify-center">
                      {def.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {def.title}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1.5">
                        at x = <strong className="text-indigo-600 font-bold tabular-nums">{formatNum(s.x, 4)}</strong> {units.length}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveSupport(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Remove support"
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
