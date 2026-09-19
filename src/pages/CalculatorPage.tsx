import React, { useState, useMemo, useEffect } from 'react';
import {
  BeamProperties,
  Support,
  Load,
  UnitSystem,
  SignConvention,
  PresetBeam
} from '../types/beam';
import { analyzeBeam } from '../engine/beamSolver';
import { PRESET_BEAMS } from '../engine/presets';
import {
  convertLength,
  convertForce,
  convertDistLoad,
  convertMoment,
  convertE,
  convertI,
  UNIT_CONFIGS,
  formatNum
} from '../engine/units';
import { Header } from '../components/Common/Header';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { BeamFBD } from '../components/Visualization/BeamFBD';
import { CrossSectionInspector } from '../components/Visualization/CrossSectionInspector';
import { DiagramsView } from '../components/Visualization/DiagramsView';
import { CalculationStepsModal } from '../components/Educational/CalculationStepsModal';
import { SlidersHorizontal, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'beamlab_v1_state';

export const CalculatorPage: React.FC = () => {
  // Mobile responsive tab state ('editor' | 'results')
  const [mobileTab, setMobileTab] = useState<'editor' | 'results'>('editor');

  // Try loading saved state from Local Storage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.beam && parsed.supports && parsed.loads) {
          return parsed;
        }
      }
    } catch {
      // ignore parse error
    }
    return null;
  };

  const initialData = loadSavedState();

  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    initialData?.unitSystem || 'metric'
  );
  const [signConvention, setSignConvention] = useState<SignConvention>(
    initialData?.signConvention || 'standard'
  );
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [inspectedX, setInspectedX] = useState<number>(
    initialData?.beam ? initialData.beam.length / 2 : 3
  );
  const [isStepsOpen, setIsStepsOpen] = useState<boolean>(false);

  const [beam, setBeam] = useState<BeamProperties>(
    initialData?.beam || {
      length: 6,
      E: 200,
      I: 100
    }
  );

  const [supports, setSupports] = useState<Support[]>(
    initialData?.supports || [
      { id: 'supp_1', type: 'pin', x: 0 },
      { id: 'supp_2', type: 'roller', x: 6 }
    ]
  );

  const [loads, setLoads] = useState<Load[]>(
    initialData?.loads || [
      { id: 'load_1', type: 'point', x: 3, magnitude: 50 }
    ]
  );

  // Local Storage Auto-Save
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          beam,
          supports,
          loads,
          unitSystem,
          signConvention
        })
      );
    } catch {
      // storage full or disabled
    }
  }, [beam, supports, loads, unitSystem, signConvention]);

  // Real-time finite element structural analysis
  const analysisResult = useMemo(() => {
    return analyzeBeam(beam, supports, loads, unitSystem);
  }, [beam, supports, loads, unitSystem]);

  // Unit conversion handler - maintain full double-precision floating-point accuracy
  const handleToggleUnitSystem = (newSystem: UnitSystem) => {
    if (newSystem === unitSystem) return;

    const newL = convertLength(beam.length, unitSystem, newSystem);
    const newE = convertE(beam.E, unitSystem, newSystem);
    const newI = convertI(beam.I, unitSystem, newSystem);
    const newInspectedX = convertLength(inspectedX, unitSystem, newSystem);

    const newSupports = supports.map((s) => ({
      ...s,
      x: convertLength(s.x, unitSystem, newSystem)
    }));

    const newLoads = loads.map((l) => {
      const converted: Load = {
        ...l,
        x: convertLength(l.x, unitSystem, newSystem)
      };
      if (l.xEnd !== undefined) {
        converted.xEnd = convertLength(l.xEnd, unitSystem, newSystem);
      }

      if (l.type === 'point') {
        converted.magnitude = convertForce(l.magnitude, unitSystem, newSystem);
      } else if (l.type === 'udl') {
        converted.magnitude = convertDistLoad(l.magnitude, unitSystem, newSystem);
      } else if (l.type === 'triangular') {
        converted.magnitude = convertDistLoad(l.magnitude, unitSystem, newSystem);
        if (l.magnitudeEnd !== undefined) {
          converted.magnitudeEnd = convertDistLoad(l.magnitudeEnd, unitSystem, newSystem);
        }
      } else if (l.type === 'moment') {
        converted.magnitude = convertMoment(l.magnitude, unitSystem, newSystem);
      }

      return converted;
    });

    setUnitSystem(newSystem);
    setBeam({ length: newL, E: newE, I: newI });
    setInspectedX(newInspectedX);
    setSupports(newSupports);
    setLoads(newLoads);
  };

  // Preset selection
  const handleSelectPreset = (preset: PresetBeam) => {
    setBeam({ ...preset.beam });
    setSupports([...preset.supports]);
    setLoads([...preset.loads]);
    setInspectedX(preset.beam.length / 2);
  };

  // Reset to default
  const handleReset = () => {
    const defaultPreset = PRESET_BEAMS[0];
    handleSelectPreset(defaultPreset);
  };

  // Support CRUD
  const handleAddSupport = (newSupp: Support) => {
    setSupports((prev) => [...prev, newSupp]);
  };

  const handleRemoveSupport = (id: string) => {
    setSupports((prev) => prev.filter((s) => s.id !== id));
  };

  // Load CRUD
  const handleAddLoad = (newLoad: Load) => {
    setLoads((prev) => [...prev, newLoad]);
  };

  const handleRemoveLoad = (id: string) => {
    setLoads((prev) => prev.filter((l) => l.id !== id));
  };

  // Homework Export: High-Res PNG
  const handleExportPng = () => {
    const svgs = document.querySelectorAll('main svg');
    if (!svgs || svgs.length === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 1100;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header title & Student info
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('B.E.A.M. Calculator � Structural Analysis Homework Report', 50, 48);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Inter, sans-serif';
    const unitLabel = unitSystem === 'metric' ? 'Metric (SI)' : 'Imperial (US)';
    ctx.fillText(
      `Span: ${beam.length} ${unitSystem === 'metric' ? 'm' : 'ft'} | System: ${unitLabel} | Date: ${new Date().toLocaleDateString()}`,
      50,
      72
    );

    // Summary Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 88, width - 100, 44);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 88, width - 100, 44);

    ctx.fillStyle = '#1e293b';
    ctx.font = '600 12px Inter, sans-serif';
    const reportUnits = UNIT_CONFIGS[unitSystem];
    ctx.fillText(
      `Max Shear: ${formatNum(analysisResult.maxAbsShear.value, 4)} ${reportUnits.force} | Max Moment: ${formatNum(analysisResult.maxAbsMoment.value, 4)} ${reportUnits.moment} | Max Deflection: ${formatNum(analysisResult.maxAbsDeflection.value, 4)} ${reportUnits.deflection} | Equilibrium: Balanced`,
      70,
      115
    );

    // Render SVGs sequentially onto canvas
    const svgArray = Array.from(svgs);
    let loadedCount = 0;

    svgArray.forEach((svg, index) => {
      const xml = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const imgWidth = width - 100;
        const imgHeight = 210;
        const yPos = 150 + index * 230;
        ctx.drawImage(img, 50, yPos, imgWidth, imgHeight);
        URL.revokeObjectURL(url);
        loadedCount++;

        if (loadedCount === svgArray.length) {
          const a = document.createElement('a');
          a.download = `beam-calculator-homework-report-${Date.now()}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
        }
      };
      img.src = url;
    });
  };

  // Homework Export: Print / PDF
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top SaaS Header */}
      <Header
        unitSystem={unitSystem}
        onToggleUnitSystem={handleToggleUnitSystem}
        signConvention={signConvention}
        onToggleSignConvention={setSignConvention}
        onOpenSteps={() => setIsStepsOpen(true)}
        onReset={handleReset}
        onExportPng={handleExportPng}
        onPrintPdf={handlePrintPdf}
        isStable={analysisResult.isStable}
        isDeterminate={analysisResult.isDeterminate}
        degreeOfIndeterminacy={analysisResult.degreeOfIndeterminacy}
      />

      {/* Mobile Navigation Tabs (< lg) */}
      <div className="lg:hidden sticky top-14 z-20 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'editor'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>1. Setup & Loads</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              mobileTab === 'editor'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {supports.length + loads.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('results')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'results'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>2. Diagrams & Results</span>
          {analysisResult.isStable && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar: Inputs & Icon-driven Toolbox */}
        <div
          className={`w-full lg:w-auto flex-col ${
            mobileTab === 'editor' ? 'flex flex-1 overflow-y-auto' : 'hidden lg:flex'
          }`}
        >
          <Sidebar
            beam={beam}
            supports={supports}
            loads={loads}
            unitSystem={unitSystem}
            onUpdateBeam={setBeam}
            onAddSupport={handleAddSupport}
            onRemoveSupport={handleRemoveSupport}
            onAddLoad={handleAddLoad}
            onRemoveLoad={handleRemoveLoad}
            onSelectPreset={handleSelectPreset}
          />

          {/* Mobile CTA: Proceed to results */}
          <div className="lg:hidden p-3 bg-white border-t border-slate-200 sticky bottom-0 z-20 shadow-md">
            <button
              type="button"
              onClick={() => {
                setMobileTab('results');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>View Diagrams & Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Main Panel: FBD, Exact Cross-Section Query & Graphs */}
        <main
          className={`flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 bg-slate-50 ${
            mobileTab === 'results' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Mobile Quick Navigation Pill */}
          <div className="lg:hidden flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => {
                setMobileTab('editor');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Model & Loads</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  analysisResult.isStable ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span>
                {analysisResult.isStable ? 'Equilibrium OK' : 'Unstable'} ({beam.length}{' '}
                {unitSystem === 'metric' ? 'm' : 'ft'})
              </span>
            </div>
          </div>

          {/* Interactive Free Body Diagram */}
          <BeamFBD
            beam={beam}
            supports={supports}
            loads={loads}
            reactions={analysisResult.reactions}
            unitSystem={unitSystem}
            hoverX={hoverX !== null ? hoverX : inspectedX}
            onHoverX={setHoverX}
          />

          {/* Exact Cross-Section Inspector & Numerical Query Tool */}
          {analysisResult.isStable && (
            <CrossSectionInspector
              xValue={inspectedX}
              onChangeX={(val) => {
                setInspectedX(val);
                setHoverX(null);
              }}
              beam={beam}
              supports={supports}
              loads={loads}
              result={analysisResult}
              unitSystem={unitSystem}
            />
          )}

          {/* Interactive Diagrams (SFD, BMD, Deflection) */}
          {analysisResult.isStable && (
            <DiagramsView
              result={analysisResult}
              beamLength={beam.length}
              unitSystem={unitSystem}
              signConvention={signConvention}
              onToggleSignConvention={setSignConvention}
              hoverX={hoverX}
              onHoverX={setHoverX}
              activeX={inspectedX}
            />
          )}
        </main>
      </div>

      {/* Step-by-Step Educational Derivation Modal */}
      <CalculationStepsModal
        isOpen={isStepsOpen}
        onClose={() => setIsStepsOpen(false)}
        result={analysisResult}
        unitSystem={unitSystem}
      />
    </div>
  );
};

export default CalculatorPage;
