import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UnitSystem, SignConvention } from '../../types/beam';
import {
  BookOpen,
  Download,
  RotateCcw,
  Layers,
  Settings,
  Image,
  Printer,
  Check,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  unitSystem: UnitSystem;
  onToggleUnitSystem: (system: UnitSystem) => void;
  signConvention: SignConvention;
  onToggleSignConvention: (conv: SignConvention) => void;
  onOpenSteps: () => void;
  onReset: () => void;
  onExportPng: () => void;
  onPrintPdf: () => void;
  isStable: boolean;
  isDeterminate: boolean;
  degreeOfIndeterminacy: number;
}

export const Header: React.FC<HeaderProps> = ({
  unitSystem,
  onToggleUnitSystem,
  signConvention,
  onToggleSignConvention,
  onOpenSteps,
  onReset,
  onExportPng,
  onPrintPdf,
  isStable,
  isDeterminate,
  degreeOfIndeterminacy
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs">
      {/* Left: Brand & Status Badge */}
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="flex items-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer group"
          title="Return to B.E.A.M. 3D Landing Page"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-xs transition-colors">
            <Layers className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h1 className="text-base font-black tracking-tight text-slate-900">
            B.E.A.M. <span className="text-indigo-600">Calculator</span>
          </h1>
        </Link>

        {/* Subtle Equilibrium / Status Badge */}
        {isStable ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Equilibrium: Balanced</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-slate-600 font-medium">
              {isDeterminate ? 'Determinate' : `Indeterminate (Deg ${degreeOfIndeterminacy})`}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Unstable Mechanism</span>
          </div>
        )}
      </div>

      {/* Right: Actions, Export, Settings, Steps */}
      <div className="flex items-center space-x-2">
        {/* Calculation Steps Button */}
        <button
          type="button"
          onClick={onOpenSteps}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Calculation Steps</span>
        </button>

        {/* Export Button & Dropdown */}
        <div ref={exportRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setExportOpen(!exportOpen);
              setSettingsOpen(false);
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Export diagrams for homework / reports"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-tooltip">
              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onExportPng();
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Image className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-slate-800">Download PNG</div>
                  <div className="text-[10px] text-slate-400">High-res diagram image</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportOpen(false);
                  onPrintPdf();
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer border-t border-slate-100"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-slate-800">Print / Save PDF</div>
                  <div className="text-[10px] text-slate-400">Standard printable report</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Settings Icon & Dropdown */}
        <div ref={settingsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setSettingsOpen(!settingsOpen);
              setExportOpen(false);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-2xs ${
              settingsOpen
                ? 'bg-slate-100 border-slate-300 text-slate-900'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
            }`}
            title="Settings (Units & Sign Convention)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-tooltip space-y-3">
              {/* Unit System Setting */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Unit System
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => onToggleUnitSystem('metric')}
                    className={`py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      unitSystem === 'metric'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Metric (SI)
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleUnitSystem('imperial')}
                    className={`py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      unitSystem === 'imperial'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Imperial (US)
                  </button>
                </div>
              </div>

              {/* BMD Sign Convention Setting */}
              <div className="border-t border-slate-100 pt-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  BMD Sign Convention
                </span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => onToggleSignConvention('standard')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      signConvention === 'standard'
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>Standard (+Sagging Up)</div>
                      <div className="text-[10px] text-slate-400 font-normal">American mechanics standard</div>
                    </div>
                    {signConvention === 'standard' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSignConvention('tension_side')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      signConvention === 'tension_side'
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>Tension Side (+Sagging Down)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Civil / European standard</div>
                    </div>
                    {signConvention === 'tension_side' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          title="Reset to default beam"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
