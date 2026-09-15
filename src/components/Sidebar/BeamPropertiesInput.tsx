import React from 'react';
import { BeamProperties, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS } from '../../engine/units';
import { Ruler } from 'lucide-react';

interface BeamPropertiesInputProps {
  beam: BeamProperties;
  unitSystem: UnitSystem;
  onChange: (updated: BeamProperties) => void;
}

export const BeamPropertiesInput: React.FC<BeamPropertiesInputProps> = ({
  beam,
  unitSystem,
  onChange
}) => {
  const units = UNIT_CONFIGS[unitSystem];

  const handleMaterialPreset = (type: 'steel' | 'concrete' | 'timber') => {
    if (unitSystem === 'metric') {
      if (type === 'steel') onChange({ ...beam, E: 200 });
      else if (type === 'concrete') onChange({ ...beam, E: 30 });
      else if (type === 'timber') onChange({ ...beam, E: 12 });
    } else {
      if (type === 'steel') onChange({ ...beam, E: 29000 });
      else if (type === 'concrete') onChange({ ...beam, E: 4350 });
      else if (type === 'timber') onChange({ ...beam, E: 1740 });
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-indigo-600" />
          Beam Span & Section
        </label>
      </div>

      {/* Beam Length */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-700">
          <span>Total Length (L)</span>
          <span className="text-slate-400 font-semibold text-[11px]">[{units.length}]</span>
        </div>
        <div className="relative">
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={beam.length}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                onChange({ ...beam, length: val });
              }
            }}
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            placeholder="6.0"
          />
          <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400 pointer-events-none">
            {units.length}
          </span>
        </div>
      </div>

      {/* E and I Inputs */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-700">
            <span>Modulus (E)</span>
            <span className="text-slate-400 font-semibold text-[11px]">[{units.stress}]</span>
          </div>
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={beam.E}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                onChange({ ...beam, E: val });
              }
            }}
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-medium text-slate-700">
            <span>Inertia (I)</span>
            <span className="text-slate-400 font-semibold text-[11px]">[{units.inertia}]</span>
          </div>
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            value={beam.I}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                onChange({ ...beam, I: val });
              }
            }}
            className="w-full bg-slate-50 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Material Quick Presets */}
      <div className="pt-0.5">
        <div className="text-[11px] font-medium text-slate-500 mb-1.5">
          Material Presets:
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleMaterialPreset('steel')}
            className="py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Steel
          </button>
          <button
            type="button"
            onClick={() => handleMaterialPreset('concrete')}
            className="py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Concrete
          </button>
          <button
            type="button"
            onClick={() => handleMaterialPreset('timber')}
            className="py-1 px-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Timber
          </button>
        </div>
      </div>
    </div>
  );
};
