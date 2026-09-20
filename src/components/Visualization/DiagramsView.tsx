import React, { useRef, useMemo } from 'react';
import { AnalysisResult, SignConvention, UnitSystem, InternalHingeResult } from '../../types/beam';
import { UNIT_CONFIGS, formatNum } from '../../engine/units';
import { IBeamIcon } from '../Common/IBeamIcon';
import { ShearIcon, MomentIcon, DeflectionIcon } from '../Common/EngineeringIcons';

interface DiagramsViewProps {
  result: AnalysisResult;
  beamLength: number;
  unitSystem: UnitSystem;
  signConvention: SignConvention;
  onToggleSignConvention: (conv: SignConvention) => void;
  hoverX: number | null;
  onHoverX: (x: number | null) => void;
  activeX: number;
}

export const DiagramsView: React.FC<DiagramsViewProps> = ({
  result,
  beamLength,
  unitSystem,
  signConvention,
  hoverX,
  onHoverX,
  activeX
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const units = UNIT_CONFIGS[unitSystem];

  const { diagramPoints, maxAbsShear, maxAbsMoment, maxAbsDeflection, internalHinges } = result;

  const currentX = hoverX !== null ? hoverX : activeX;

  // Optimized binary search for closest sample point in sorted diagramPoints (O(log N))
  const getHoverValues = (x: number) => {
    if (!diagramPoints || diagramPoints.length === 0) return null;
    let low = 0;
    let high = diagramPoints.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (diagramPoints[mid].x < x) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const idx = Math.max(0, Math.min(diagramPoints.length - 1, low));
    if (idx > 0 && Math.abs(diagramPoints[idx - 1].x - x) < Math.abs(diagramPoints[idx].x - x)) {
      return diagramPoints[idx - 1];
    }
    return diagramPoints[idx];
  };

  const currentVals = useMemo(() => getHoverValues(currentX), [currentX, diagramPoints]);

  // Memoize mapped point arrays to avoid allocating on every mouse movement
  const sfdPoints = useMemo(
    () => diagramPoints.map((p) => ({ x: p.x, y: p.shear })),
    [diagramPoints]
  );

  const bmdPoints = useMemo(
    () =>
      diagramPoints.map((p) => ({
        x: p.x,
        y: signConvention === 'tension_side' ? -p.moment : p.moment
      })),
    [diagramPoints, signConvention]
  );

  const deflectionPoints = useMemo(
    () => diagramPoints.map((p) => ({ x: p.x, y: p.deflection })),
    [diagramPoints]
  );

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Floating Coordinates Banner with FIXED reserved height to guarantee ZERO layout shifts */}
      <div className="sticky top-14 sm:top-16 z-20 min-h-[46px] bg-white/95 backdrop-blur-md border border-indigo-200 rounded-xl px-3 sm:px-4 py-2 shadow-sm flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <IBeamIcon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
          <span className="text-slate-500 font-medium">
            {hoverX !== null ? 'Inspecting x:' : 'Location x:'}
          </span>
          <span className="text-indigo-700 font-extrabold text-xs sm:text-sm tabular-nums">
            {formatNum(currentX, 4)} {units.length}
          </span>
          {hoverX !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold animate-pulse">
              Live
            </span>
          )}
        </div>

        {currentVals && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] sm:text-xs">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
              <span className="text-slate-500 font-medium">V:</span>
              <span className={`font-bold tabular-nums ${currentVals.shear >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currentVals.shear > 0 ? '+' : ''}{formatNum(currentVals.shear, 4)} {units.force}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-600 flex-shrink-0" />
              <span className="text-slate-500 font-medium">M:</span>
              <span className={`font-bold tabular-nums ${currentVals.moment >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {currentVals.moment > 0 ? '+' : ''}{formatNum(currentVals.moment, 4)} {units.moment}
              </span>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-600 flex-shrink-0" />
              <span className="text-slate-500 font-medium">δ:</span>
              <span className="text-amber-700 font-bold tabular-nums">
                {formatNum(currentVals.deflection, 4)} {units.deflection}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Shear Force Diagram (SFD) */}
      <DiagramCard
        id="sfd"
        title="Shear Force (SFD)"
        icon={<ShearIcon className="w-4 h-4 text-blue-600" />}
        unit={units.force}
        maxDisplay={`Max |V| = ${formatNum(maxAbsShear.value)} ${units.force} (x = ${formatNum(maxAbsShear.x)} ${units.length})`}
        usePosNegColors={true}
        points={sfdPoints}
        beamLength={beamLength}
        unitsLength={units.length}
        hoverX={currentX}
        onHoverX={onHoverX}
        criticalPoints={result.criticalPoints.filter((c) => c.type === 'zero_shear')}
      />

      {/* 2. Bending Moment Diagram (BMD) */}
      <DiagramCard
        id="bmd"
        title="Bending Moment (BMD)"
        icon={<MomentIcon className="w-4 h-4 text-indigo-600" />}
        unit={units.moment}
        maxDisplay={`Max |M| = ${formatNum(maxAbsMoment.value)} ${units.moment} (x = ${formatNum(maxAbsMoment.x)} ${units.length})`}
        usePosNegColors={true}
        points={bmdPoints}
        beamLength={beamLength}
        unitsLength={units.length}
        hoverX={currentX}
        onHoverX={onHoverX}
      />

      {/* 3. Deflection Diagram (Elastic Curve) */}
      <DiagramCard
        id="deflection"
        title="Deflection (Elastic Curve)"
        icon={<DeflectionIcon className="w-4 h-4 text-amber-600" />}
        unit={units.deflection}
        maxDisplay={`Max |δ| = ${formatNum(maxAbsDeflection.value)} ${units.deflection} (x = ${formatNum(maxAbsDeflection.x)} ${units.length})`}
        color="#4f46e5"
        fillColor="#6366f1"
        usePosNegColors={false}
        points={deflectionPoints}
        beamLength={beamLength}
        unitsLength={units.length}
        hoverX={currentX}
        onHoverX={onHoverX}
        internalHinges={internalHinges}
        unitSystem={unitSystem}
      />
    </div>
  );
};

interface DiagramCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  unit: string;
  maxDisplay?: string;
  color?: string;
  fillColor?: string;
  usePosNegColors?: boolean;
  points: { x: number; y: number }[];
  beamLength: number;
  unitsLength: string;
  hoverX: number | null;
  onHoverX: (x: number | null) => void;
  criticalPoints?: { x: number; label: string }[];
  customBadge?: React.ReactNode;
  internalHinges?: InternalHingeResult[];
  unitSystem?: UnitSystem;
}

const DiagramCardComponent: React.FC<DiagramCardProps> = ({
  id,
  title,
  icon,
  unit,
  maxDisplay,
  points,
  beamLength,
  hoverX,
  onHoverX,
  criticalPoints = [],
  customBadge,
  usePosNegColors = true,
  color = '#4f46e5',
  fillColor = '#818cf8',
  internalHinges,
  unitSystem = 'metric'
}) => {
  const svgWidth = 1000;
  const svgHeight = 180;
  const marginX = 80;
  const marginY = 30;
  const usableWidth = svgWidth - 2 * marginX;
  const usableHeight = svgHeight - 2 * marginY;

  // Memoize path calculations so hovering never recomputes 600-point geometries
  const { linePathD, fillPathD, absLimit, toSvgX, toSvgY, zeroSvgY, zeroPercent } = useMemo(() => {
    const scaleX = beamLength > 0 ? usableWidth / beamLength : 1;
    const toSvgX = (x: number) => marginX + x * scaleX;

    let minY = 0;
    let maxY = 0;
    for (let i = 0; i < points.length; i++) {
      const py = points[i].y;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const absLimit = Math.max(Math.abs(minY), Math.abs(maxY), 1e-4);
    const yDomain = absLimit * 1.15;

    const toSvgY = (val: number) => {
      const zeroY = marginY + usableHeight / 2;
      return zeroY - (val / yDomain) * (usableHeight / 2);
    };

    const zeroSvgY = toSvgY(0);
    const zeroPercent = Math.max(0, Math.min(100, (zeroSvgY / svgHeight) * 100));

    let linePathD = '';
    let fillPathD = '';

    if (points.length > 0) {
      linePathD = `M ${toSvgX(points[0].x)},${toSvgY(points[0].y)}`;
      fillPathD = `M ${toSvgX(points[0].x)},${zeroSvgY} L ${toSvgX(points[0].x)},${toSvgY(points[0].y)}`;

      for (let i = 1; i < points.length; i++) {
        const sx = toSvgX(points[i].x);
        const sy = toSvgY(points[i].y);
        linePathD += ` L ${sx},${sy}`;
        fillPathD += ` L ${sx},${sy}`;
      }

      const lastX = toSvgX(points[points.length - 1].x);
      fillPathD += ` L ${lastX},${zeroSvgY} Z`;
    }

    return { linePathD, fillPathD, absLimit, toSvgX, toSvgY, zeroSvgY, zeroPercent };
  }, [points, beamLength, usableWidth, usableHeight, marginX, marginY, svgHeight]);

  const scaleX = beamLength > 0 ? usableWidth / beamLength : 1;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:space-x-2">
          {customBadge}
          {maxDisplay && (
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tabular-nums">
              {maxDisplay}
            </span>
          )}
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
            [{unit}]
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[580px] sm:min-w-[650px] cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const currentSvgX = (clientX / rect.width) * svgWidth;
            const rawX = (currentSvgX - marginX) / scaleX;
            if (rawX >= 0 && rawX <= beamLength) {
              onHoverX(rawX);
            }
          }}
          onMouseLeave={() => onHoverX(null)}
          onTouchStart={(e) => {
            if (e.touches.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.touches[0].clientX - rect.left;
            const currentSvgX = (clientX / rect.width) * svgWidth;
            const rawX = (currentSvgX - marginX) / scaleX;
            if (rawX >= 0 && rawX <= beamLength) {
              onHoverX(rawX);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.touches[0].clientX - rect.left;
            const currentSvgX = (clientX / rect.width) * svgWidth;
            const rawX = (currentSvgX - marginX) / scaleX;
            if (rawX >= 0 && rawX <= beamLength) {
              onHoverX(rawX);
            }
          }}
          onTouchEnd={() => onHoverX(null)}
          style={{ touchAction: 'pan-y' }}
        >
          <defs>
            {usePosNegColors ? (
              <>
                {/* Two-tone gradient: Green above zero line, Red below */}
                <linearGradient id={`fillGrad_${id}`} x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.32" />
                  <stop offset={`${zeroPercent}%`} stopColor="#16a34a" stopOpacity="0.06" />
                  <stop offset={`${zeroPercent}%`} stopColor="#dc2626" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.32" />
                </linearGradient>

                <linearGradient id={`strokeGrad_${id}`} x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset={`${zeroPercent}%`} stopColor="#16a34a" />
                  <stop offset={`${zeroPercent}%`} stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </>
            ) : (
              <linearGradient id={`fillGrad_${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0.05" />
              </linearGradient>
            )}
          </defs>

          {/* Zero baseline */}
          <line
            x1={marginX}
            y1={zeroSvgY}
            x2={svgWidth - marginX}
            y2={zeroSvgY}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Diagram Shaded Fill Area */}
          <path d={fillPathD} fill={`url(#fillGrad_${id})`} />

          {/* Diagram Outline Curve */}
          <path
            d={linePathD}
            fill="none"
            stroke={usePosNegColors ? `url(#strokeGrad_${id})` : color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Visualizing Internal Hinge Kink & Discontinuous Tangent Lines */}
          {internalHinges && internalHinges.map((h, hIdx) => {
            const hx = toSvgX(h.x);
            const hy = toSvgY(h.deflection);
            const unitFactor = unitSystem === 'imperial' ? 12 : 1000;
            const deltaX = Math.min(0.8, beamLength * 0.15); // visual extent of tangent line

            const xL = Math.max(0, h.x - deltaX);
            const vL = h.deflection - unitFactor * h.thetaLeft * (h.x - xL);
            const sxL = toSvgX(xL);
            const syL = toSvgY(vL);

            const xR = Math.min(beamLength, h.x + deltaX);
            const vR = h.deflection + unitFactor * h.thetaRight * (xR - h.x);
            const sxR = toSvgX(xR);
            const syR = toSvgY(vR);

            return (
              <g key={`hinge_kink_${hIdx}`}>
                {/* Tangent line left (Slope theta_L) */}
                <line
                  x1={sxL}
                  y1={syL}
                  x2={hx}
                  y2={hy}
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {/* Tangent line right (Slope theta_R) */}
                <line
                  x1={hx}
                  y1={hy}
                  x2={sxR}
                  y2={syR}
                  stroke="#ea580c"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                {/* Hinge Pin vertex marker on elastic curve */}
                <circle cx={hx} cy={hy} r="5.5" fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                <circle cx={hx} cy={hy} r="2" fill="#d97706" />

                {/* Hinge Kink Label Badge */}
                <g pointerEvents="none">
                  <rect
                    x={hx - 55}
                    y={hy - 26}
                    width="110"
                    height="17"
                    rx="4"
                    fill="#ffffff"
                    fillOpacity="0.95"
                    stroke="#d97706"
                    strokeWidth="1.2"
                  />
                  <text
                    x={hx}
                    y={hy - 14}
                    textAnchor="middle"
                    className="text-[9px] font-sans font-black fill-amber-900 tabular-nums select-none"
                  >
                    Kink: Δθ = {formatNum(h.deltaTheta, 4)} rad
                  </text>
                </g>
              </g>
            );
          })}

          {/* Y Axis Reference Labels (Sans-Serif Tabular) */}
          <text
            x={marginX - 8}
            y={toSvgY(absLimit)}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-[10px] font-sans font-bold fill-slate-500 tabular-nums"
          >
            +{formatNum(absLimit, 4)}
          </text>
          <text
            x={marginX - 8}
            y={zeroSvgY}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-[10px] font-sans font-extrabold fill-slate-700 tabular-nums"
          >
            0
          </text>
          <text
            x={marginX - 8}
            y={toSvgY(-absLimit)}
            textAnchor="end"
            alignmentBaseline="middle"
            className="text-[10px] font-sans font-bold fill-slate-500 tabular-nums"
          >
            -{formatNum(absLimit, 4)}
          </text>

          {/* Critical Points */}
          {criticalPoints.map((cp, idx) => (
            <g key={`cp_${idx}`}>
              <circle
                cx={toSvgX(cp.x)}
                cy={zeroSvgY}
                r="4"
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                x={toSvgX(cp.x)}
                y={zeroSvgY - 8}
                textAnchor="middle"
                className="text-[10px] font-sans font-bold fill-rose-700"
              >
                {cp.label}
              </text>
            </g>
          ))}

          {/* Hover Crosshair Cursor */}
          {hoverX !== null && (
            <g pointerEvents="none">
              <line
                x1={toSvgX(hoverX)}
                y1={marginY}
                x2={toSvgX(hoverX)}
                y2={svgHeight - marginY}
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

const DiagramCard = React.memo(DiagramCardComponent);
