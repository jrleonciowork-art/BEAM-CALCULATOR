import React from 'react';
import { BeamProperties, BeamSegment, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, normalizeBeamSegments } from '../../engine/units';
import { Ruler, Plus, Trash2, Layers, TrendingUp } from 'lucide-react';

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
  const segments = normalizeBeamSegments(beam);

  const updateSegments = (newSegments: BeamSegment[]) => {
    // Ensure beam total length matches the maximum xEnd
    const maxEnd = Math.max(0.1, ...newSegments.map((s) => s.xEnd));
    const firstSeg = newSegments[0];
    onChange({
      ...beam,
      length: maxEnd,
      segments: newSegments,
      E: firstSeg ? firstSeg.E : 200,
      I: firstSeg ? firstSeg.I : 100
    });
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? lastSeg.xEnd : 0;
    const defaultSpan = 3;
    const newEnd = Number((newStart + defaultSpan).toFixed(4));
    const newE = lastSeg ? lastSeg.E : unitSystem === 'metric' ? 200 : 29000;
    const newI = lastSeg ? lastSeg.I : unitSystem === 'metric' ? 100 : 150;

    const newSegment: BeamSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      xStart: newStart,
      xEnd: newEnd,
      E: newE,
      I: newI,
      isTapered: false
    };

    updateSegments([...segments, newSegment]);
  };

  const handleRemoveSegment = (id: string) => {
    if (segments.length <= 1) return;
    const remaining = segments.filter((s) => s.id !== id);
    // Re-chain segment coordinates to maintain contiguous span
    const chained: BeamSegment[] = [];
    let currentX = 0;
    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      const span = Math.max(0.1, seg.xEnd - seg.xStart);
      chained.push({
        ...seg,
        xStart: currentX,
        xEnd: Number((currentX + span).toFixed(4))
      });
      currentX = Number((currentX + span).toFixed(4));
    }
    updateSegments(chained);
  };

  const handleUpdateSegment = (id: string, partial: Partial<BeamSegment>) => {
    const updated = segments.map((seg) => {
      if (seg.id === id) {
        return { ...seg, ...partial };
      }
      return seg;
    });
    updateSegments(updated);
  };

  const handleMaterialPreset = (type: 'steel' | 'concrete' | 'timber') => {
    let newE = 200;
    if (unitSystem === 'metric') {
      if (type === 'steel') newE = 200;
      else if (type === 'concrete') newE = 30;
      else if (type === 'timber') newE = 12;
    } else {
      if (type === 'steel') newE = 29000;
      else if (type === 'concrete') newE = 4350;
      else if (type === 'timber') newE = 1740;
    }

    const updated = segments.map((s) => ({ ...s, E: newE }));
    updateSegments(updated);
  };

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm space-y-3.5">
      {/* Header & Span Summary */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Beam Span & Segments
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Non-Prismatic Cross-Sections
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 tabular-nums">
          <span>L = {beam.length} {units.length}</span>
        </div>
      </div>

      {/* Dynamic Segments List */}
      <div className="space-y-3">
        {segments.map((seg, idx) => {
          const isFirst = idx === 0;
          return (
            <div
              key={seg.id}
              className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2.5 transition-all relative hover:border-slate-300"
            >
              {/* Segment Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                    Segment #{idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold tabular-nums">
                    [{seg.xStart} → {seg.xEnd} {units.length}]
                  </span>
                </div>

                {segments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSegment(seg.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove this segment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Coordinate Inputs: Start x & End x */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-600">
                    <span>Start x</span>
                    <span className="text-slate-400 text-[10px]">[{units.length}]</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    disabled={isFirst} // First segment always anchors at x=0
                    value={seg.xStart}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        handleUpdateSegment(seg.id, { xStart: val });
                      }
                    }}
                    className={`w-full text-xs font-bold border rounded-lg px-2.5 py-1.5 outline-none transition-colors tabular-nums ${
                      isFirst
                        ? 'bg-slate-100/80 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-900 border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-600">
                    <span>End x</span>
                    <span className="text-slate-400 text-[10px]">[{units.length}]</span>
                  </div>
                  <input
                    type="number"
                    min={seg.xStart + 0.0001}
                    step="0.0001"
                    value={seg.xEnd}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > seg.xStart) {
                        handleUpdateSegment(seg.id, { xEnd: val });
                      }
                    }}
                    className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors tabular-nums"
                  />
                </div>
              </div>

              {/* Material Modulus E and Moment of Inertia I */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-600">
                    <span>Modulus (E)</span>
                    <span className="text-slate-400 text-[10px]">[{units.stress}]</span>
                  </div>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={seg.E}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        handleUpdateSegment(seg.id, { E: val });
                      }
                    }}
                    className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors tabular-nums"
                  />
                </div>

                {!seg.isTapered ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-600">
                      <span>Inertia (I)</span>
                      <span className="text-slate-400 text-[10px]">[{units.inertia}]</span>
                    </div>
                    <input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={seg.I}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          handleUpdateSegment(seg.id, { I: val });
                        }
                      }}
                      className="w-full bg-white text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors tabular-nums"
                    />
                  </div>
                ) : (
                  <div className="col-span-2 grid grid-cols-2 gap-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-indigo-900">
                        <span>I (Start)</span>
                        <span className="text-indigo-400 text-[10px]">[{units.inertia}]</span>
                      </div>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={seg.I}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateSegment(seg.id, { I: val });
                          }
                        }}
                        className="w-full bg-white text-xs font-bold text-slate-900 border border-indigo-200 rounded-md px-2 py-1 outline-none focus:border-indigo-500 tabular-nums"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1 font-bold text-indigo-900">
                        <span>I (End)</span>
                        <span className="text-indigo-400 text-[10px]">[{units.inertia}]</span>
                      </div>
                      <input
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={seg.IEnd ?? seg.I}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            handleUpdateSegment(seg.id, { IEnd: val });
                          }
                        }}
                        className="w-full bg-white text-xs font-bold text-slate-900 border border-indigo-200 rounded-md px-2 py-1 outline-none focus:border-indigo-500 tabular-nums"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tapered Profile Toggle */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    const nextTapered = !seg.isTapered;
                    handleUpdateSegment(seg.id, {
                      isTapered: nextTapered,
                      IEnd: nextTapered ? (seg.IEnd ?? seg.I) : undefined
                    });
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    seg.isTapered
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{seg.isTapered ? 'Tapered Profile Active' : 'Enable Tapered Profile'}</span>
                </button>

                <span className="text-[10px] text-slate-400 font-medium">
                  {seg.isTapered ? 'Linearly Varying I' : 'Constant Prismatic I'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Segment Button */}
      <button
        type="button"
        onClick={handleAddSegment}
        className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Contiguous Segment</span>
      </button>

      {/* Material Quick Presets */}
      <div className="pt-1 border-t border-slate-100">
        <div className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-400" />
          <span>Apply Material Modulus (E) to all:</span>
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
