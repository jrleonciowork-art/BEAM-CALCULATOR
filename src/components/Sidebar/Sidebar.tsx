import React, { useState } from 'react';
import { BeamProperties, Support, Load, UnitSystem, PresetBeam } from '../../types/beam';
import { PresetsSelector } from './PresetsSelector';
import { BeamPropertiesInput } from './BeamPropertiesInput';
import { SupportsManager } from './SupportsManager';
import { LoadsManager } from './LoadsManager';
import { SlidersHorizontal, Anchor } from 'lucide-react';

interface SidebarProps {
  beam: BeamProperties;
  supports: Support[];
  loads: Load[];
  unitSystem: UnitSystem;
  onUpdateBeam: (beam: BeamProperties) => void;
  onAddSupport: (support: Support) => void;
  onRemoveSupport: (id: string) => void;
  onAddLoad: (load: Load) => void;
  onRemoveLoad: (id: string) => void;
  onSelectPreset: (preset: PresetBeam) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  beam,
  supports,
  loads,
  unitSystem,
  onUpdateBeam,
  onAddSupport,
  onRemoveSupport,
  onAddLoad,
  onRemoveLoad,
  onSelectPreset
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'loads'>('setup');

  const totalEntities = supports.length + loads.length;

  return (
    <aside className="w-full lg:w-[390px] xl:w-[410px] flex-shrink-0 bg-slate-50/80 border-r border-slate-200 h-auto lg:h-[calc(100dvh-3.5rem)] overflow-y-auto p-3 sm:p-4 space-y-4 select-none">
      {/* Segmented 2-Tab Navigation */}
      <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab('setup')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'setup'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Beam & Setup</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loads')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'loads'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Anchor className="w-3.5 h-3.5" />
          <span>Supports & Loads</span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full tabular-nums ${
              activeTab === 'loads'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            {totalEntities}
          </span>
        </button>
      </div>

      {/* Tab 1: Beam Dimensions & Preset Scenarios */}
      {activeTab === 'setup' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Classic Problems Dropdown */}
          <PresetsSelector onSelectPreset={onSelectPreset} />

          {/* Beam Dimensions & Material Inputs */}
          <BeamPropertiesInput
            beam={beam}
            unitSystem={unitSystem}
            onChange={onUpdateBeam}
          />
        </div>
      )}

      {/* Tab 2: Supports/Hinges and Applied Loads */}
      {activeTab === 'loads' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Supports & Hinges (Icon-driven grid) */}
          <SupportsManager
            supports={supports}
            beamLength={beam.length}
            unitSystem={unitSystem}
            onAddSupport={onAddSupport}
            onRemoveSupport={onRemoveSupport}
          />

          {/* Applied Loads (Icon-driven grid) */}
          <LoadsManager
            loads={loads}
            beamLength={beam.length}
            unitSystem={unitSystem}
            onAddLoad={onAddLoad}
            onRemoveLoad={onRemoveLoad}
          />
        </div>
      )}
    </aside>
  );
};
