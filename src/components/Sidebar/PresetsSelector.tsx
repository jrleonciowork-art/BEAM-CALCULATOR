import React from 'react';
import { PRESET_BEAMS } from '../../engine/presets';
import { PresetBeam } from '../../types/beam';
import { Sparkles, ChevronDown } from 'lucide-react';

interface PresetsSelectorProps {
  onSelectPreset: (preset: PresetBeam) => void;
}

export const PresetsSelector: React.FC<PresetsSelectorProps> = ({ onSelectPreset }) => {
  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Classic Beam Scenarios
        </label>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
          Templates
        </span>
      </div>

      <div className="relative">
        <select
          defaultValue=""
          onChange={(e) => {
            const selected = PRESET_BEAMS.find((p) => p.id === e.target.value);
            if (selected) {
              onSelectPreset(selected);
              e.target.value = '';
            }
          }}
          className="w-full bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors appearance-none pr-8 shadow-2xs"
        >
          <option value="" disabled>
            ⚡ Select a Classic Beam Scenario...
          </option>
          {PRESET_BEAMS.map((preset) => (
            <option key={preset.id} value={preset.id} className="text-slate-800 font-medium">
              {preset.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );
};
