import React, { useState } from 'react';
import { AnalysisResult, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS } from '../../engine/units';
import { X, BookOpen, Calculator, CheckCircle2, Copy, Check } from 'lucide-react';

interface CalculationStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
  unitSystem: UnitSystem;
}

export const CalculationStepsModal: React.FC<CalculationStepsModalProps> = ({
  isOpen,
  onClose,
  result,
  unitSystem
}) => {
  const [copied, setCopied] = useState(false);
  const units = UNIT_CONFIGS[unitSystem];

  if (!isOpen) return null;

  const handleCopyText = () => {
    let text = '=== BEAM ANALYSIS CALCULATION STEPS ===\n\n';
    result.calculationSteps.forEach((step) => {
      text += `${step.title}\n`;
      text += `${step.description}\n`;
      if (step.mathLines) {
        step.mathLines.forEach((m) => {
          text += `  • ${m.replace(/\\sum/g, 'Σ').replace(/\\le/g, '≤').replace(/\\textbf{([^}]+)}/g, '$1')}\n`;
        });
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Detailed Calculation Steps
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Equilibrium Derivations & Segment Piecewise Equations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer shadow-xs"
              title="Copy solution text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Solution</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {result.calculationSteps.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">
              No calculation steps available for current configuration.
            </div>
          ) : (
            result.calculationSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <span>{step.title}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {step.description}
                </p>

                {step.mathLines && step.mathLines.length > 0 && (
                  <div className="bg-white rounded-lg p-3.5 border border-slate-200 space-y-2 font-sans text-xs text-slate-800">
                    {step.mathLines.map((line, lIdx) => {
                      const cleanedLine = line
                        .replace(/\\sum/g, 'Σ')
                        .replace(/\\int/g, '∫')
                        .replace(/\\xi/g, 'ξ')
                        .replace(/\\textbf{([^}]+)}/g, '$1')
                        .replace(/\\text{([^}]+)}/g, '$1')
                        .replace(/\\quad/g, '   ')
                        .replace(/\\le/g, '≤')
                        .replace(/\\frac{([^}]+)}{([^}]+)}/g, '($1/$2)')
                        .replace(/\\approx/g, '≈');

                      const isHeader = line.includes('\\textbf{Segment');

                      return (
                        <div
                          key={lIdx}
                          className={`${
                            isHeader
                              ? 'text-indigo-900 font-bold border-t border-slate-200 pt-2 first:border-0 first:pt-0'
                              : 'text-slate-700 pl-3 border-l-2 border-indigo-400 font-semibold tabular-nums'
                          }`}
                        >
                          {cleanedLine}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Student Engineering Note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 block mb-1">
                Statics & Differential Equilibrium Summary:
              </span>
              The rate of change of shear force is equal to the negative distributed load (dV/dx = -w(x)), and the rate of change of bending moment is equal to the shear force (dM/dx = V(x)). At locations where V(x) = 0, the bending moment reaches a local maximum or minimum!
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
