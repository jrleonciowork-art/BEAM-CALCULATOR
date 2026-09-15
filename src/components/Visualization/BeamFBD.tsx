import React, { useRef } from 'react';
import { BeamProperties, Support, Load, Reaction, UnitSystem } from '../../types/beam';
import { UNIT_CONFIGS, formatNum } from '../../engine/units';

interface BeamFBDProps {
  beam: BeamProperties;
  supports: Support[];
  loads: Load[];
  reactions: Reaction[];
  unitSystem: UnitSystem;
  hoverX: number | null;
  onHoverX: (x: number | null) => void;
}

export const BeamFBD: React.FC<BeamFBDProps> = ({
  beam,
  supports,
  loads,
  reactions,
  unitSystem,
  hoverX,
  onHoverX
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const units = UNIT_CONFIGS[unitSystem];

  const svgWidth = 1060;
  const svgHeight = 280;
  const marginX = 115; // Generous margin so labels at x=0 are never clipped
  const beamY = 135;
  const beamHeight = 16;
  const usableWidth = svgWidth - 2 * marginX;
  const scaleX = beam.length > 0 ? usableWidth / beam.length : 1;

  const toSvgX = (x: number) => marginX + x * scaleX;
  const fromSvgX = (svgX: number) => {
    const rawX = (svgX - marginX) / scaleX;
    return Math.max(0, Math.min(beam.length, rawX));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const currentSvgX = (clientX / rect.width) * svgWidth;
    if (currentSvgX >= marginX - 15 && currentSvgX <= svgWidth - marginX + 15) {
      onHoverX(fromSvgX(currentSvgX));
    } else {
      onHoverX(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Free Body Diagram
          </span>
        </div>
        {hoverX !== null && (
          <div className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold tabular-nums">
            x = {formatNum(hoverX, 4)} {units.length}
          </div>
        )}
      </div>

      {/* SVG Container */}
      <div className="w-full overflow-x-auto select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[720px] cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => onHoverX(null)}
        >
          <defs>
            {/* Beam Metallic Profile */}
            <linearGradient id="beamSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Hatch pattern for ground / wall attachments */}
            <pattern id="lightHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Dimension Line across the bottom */}
          <g stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3">
            <line x1={marginX} y1={beamY + 105} x2={svgWidth - marginX} y2={beamY + 105} />
            <line x1={marginX} y1={beamY + 97} x2={marginX} y2={beamY + 113} />
            <line x1={svgWidth - marginX} y1={beamY + 97} x2={svgWidth - marginX} y2={beamY + 113} />
            <text
              x={svgWidth / 2}
              y={beamY + 121}
              textAnchor="middle"
              className="text-[11px] font-sans font-bold fill-slate-600 tabular-nums"
            >
              Total Span L = {formatNum(beam.length, 4)} {units.length}
            </text>
          </g>

          {/* Applied Distributed Loads (UDL & Triangular) */}
          {loads.map((load) => {
            if (load.type !== 'udl' && load.type !== 'triangular') return null;
            const x1 = Math.max(0, Math.min(beam.length, load.x));
            const x2 = Math.max(0, Math.min(beam.length, load.xEnd ?? beam.length));
            if (x2 <= x1) return null;

            const sx1 = toSvgX(x1);
            const sx2 = toSvgX(x2);
            const w1 = load.magnitude;
            const w2 = load.type === 'triangular' ? (load.magnitudeEnd ?? 0) : load.magnitude;

            const maxRefLoad = 50;
            const h1 = Math.min(50, Math.max(20, (w1 / maxRefLoad) * 44));
            const h2 = Math.min(50, Math.max(20, (w2 / maxRefLoad) * 44));

            const polyPoints = `${sx1},${beamY} ${sx1},${beamY - h1} ${sx2},${beamY - h2} ${sx2},${beamY}`;

            // Clean, non-overlapping downward arrows pointing straight DOWN into the beam
            const arrowSpacing = 44;
            const numArrows = Math.max(2, Math.min(6, Math.floor((sx2 - sx1) / arrowSpacing)));
            const arrows: React.ReactNode[] = [];

            for (let i = 0; i <= numArrows; i++) {
              const ax = sx1 + (i / numArrows) * (sx2 - sx1);
              const ah = h1 + (i / numArrows) * (h2 - h1);
              const yTop = beamY - ah;
              const yTip = beamY; // Touches the top of the beam

              arrows.push(
                <g key={`udl_arrow_${load.id}_${i}`}>
                  {/* Shaft */}
                  <line
                    x1={ax}
                    y1={yTop}
                    x2={ax}
                    y2={yTip - 6}
                    stroke="#0284c7"
                    strokeWidth="2"
                  />
                  {/* Explicit Arrowhead pointing DOWN */}
                  <polygon
                    points={`${ax - 4},${yTip - 6} ${ax + 4},${yTip - 6} ${ax},${yTip}`}
                    fill="#0284c7"
                  />
                </g>
              );
            }

            return (
              <g key={`dist_${load.id}`}>
                {/* Shaded distributed envelope */}
                <polygon
                  points={polyPoints}
                  fill="#0284c7"
                  fillOpacity="0.10"
                  stroke="#0284c7"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                {arrows}
                {/* Clear, elevated badge with dynamic width and adaptive font size */}
                {(() => {
                  const labelText = load.type === 'udl'
                    ? `${formatNum(w1, 4)} ${units.distLoad} ↓`
                    : `${formatNum(w1, 4)} → ${formatNum(w2, 4)} ${units.distLoad}`;
                  const badgeW = Math.max(100, labelText.length * 6.5 + 20);
                  const midX = (sx1 + sx2) / 2;
                  const fontSize = labelText.length > 20 ? 'text-[9px]' : 'text-[10px]';

                  return (
                    <g>
                      <rect
                        x={midX - badgeW / 2}
                        y={beamY - Math.max(h1, h2) - 24}
                        width={badgeW}
                        height="20"
                        rx="5"
                        fill="#ffffff"
                        stroke="#0284c7"
                        strokeWidth="1.4"
                      />
                      <text
                        x={midX}
                        y={beamY - Math.max(h1, h2) - 10}
                        textAnchor="middle"
                        className={`${fontSize} font-sans font-bold fill-sky-900 tabular-nums`}
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* Applied Concentrated Moments (Prominent Bold Curved Arc with Explicit Tangent Arrowhead) */}
          {loads.map((load) => {
            if (load.type !== 'moment') return null;
            const sx = toSvgX(load.x);
            const isCw = load.momentDirection === 'cw';
            const r = 26;
            const cy = beamY - 14;

            // Draw clean circular arc
            // CW: starts at top-left, curves around clockwise, arrow points downward-right
            // CCW: starts at top-right, curves around counter-clockwise, arrow points downward-left
            const arcPath = isCw
              ? `M ${sx - r + 4},${cy - 6} A ${r} ${r} 0 1 1 ${sx + 6},${cy - r + 3}`
              : `M ${sx + r - 4},${cy - 6} A ${r} ${r} 0 1 0 ${sx - 6},${cy - r + 3}`;

            const color = isCw ? '#d97706' : '#7c3aed';

            return (
              <g key={`mom_${load.id}`}>
                {/* Application center point */}
                <circle cx={sx} cy={beamY} r="4.5" fill={color} />

                {/* Curved Arc Body */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Explicit Arrowhead on the curve */}
                {isCw ? (
                  <polygon
                    points={`${sx + 15},${cy - r + 3} ${sx + 4},${cy - r - 5} ${sx + 6},${cy - r + 8}`}
                    fill={color}
                  />
                ) : (
                  <polygon
                    points={`${sx - 15},${cy - r + 3} ${sx - 6},${cy - r + 8} ${sx - 4},${cy - r - 5}`}
                    fill={color}
                  />
                )}

                {/* Prominent Label Badge with adaptive width */}
                {(() => {
                  const momentText = `M = ${formatNum(load.magnitude, 4)} ${units.moment} (${isCw ? 'CW ↻' : 'CCW ↺'})`;
                  const mBadgeW = Math.max(110, momentText.length * 6.5 + 20);
                  const fontSize = momentText.length > 22 ? 'text-[9px]' : 'text-[10px]';

                  return (
                    <g>
                      <rect
                        x={sx - mBadgeW / 2}
                        y={cy - r - 26}
                        width={mBadgeW}
                        height="20"
                        rx="5"
                        fill="#ffffff"
                        stroke={color}
                        strokeWidth="1.4"
                      />
                      <text
                        x={sx}
                        y={cy - r - 12}
                        textAnchor="middle"
                        className={`${fontSize} font-sans font-bold tabular-nums`}
                        fill={color}
                      >
                        {momentText}
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {/* The Physical Beam Element */}
          <rect
            x={marginX}
            y={beamY}
            width={usableWidth}
            height={beamHeight}
            fill="url(#beamSteelGrad)"
            stroke="#1e293b"
            strokeWidth="2"
            rx="2"
          />

          {/* Applied Point Loads (Explicit Vertical Vectors with Guaranteed Pointing Directions) */}
          {loads.map((load) => {
            if (load.type !== 'point') return null;
            const sx = toSvgX(load.x);
            const isDown = load.magnitude >= 0;
            const arrowLen = 52;

            if (isDown) {
              // DOWNWARD Point Load: starts above and points DOWN into top of beam (beamY)
              const yStart = beamY - arrowLen;
              const yTip = beamY;
              const color = '#dc2626'; // Bold Red

              return (
                <g key={`point_${load.id}`}>
                  {/* Shaft */}
                  <line
                    x1={sx}
                    y1={yStart}
                    x2={sx}
                    y2={yTip - 8}
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Explicit Arrowhead pointing DOWN */}
                  <polygon
                    points={`${sx - 6},${yTip - 9} ${sx + 6},${yTip - 9} ${sx},${yTip}`}
                    fill={color}
                  />
                  {/* Clear Label Badge */}
                  {(() => {
                    const pointText = `${formatNum(Math.abs(load.magnitude), 4)} ${units.force} ↓`;
                    const pBadgeW = Math.max(90, pointText.length * 6.8 + 18);
                    const pFontSize = pointText.length > 16 ? 'text-[10px]' : 'text-[11px]';

                    return (
                      <g>
                        <rect
                          x={sx - pBadgeW / 2}
                          y={yStart - 22}
                          width={pBadgeW}
                          height="20"
                          rx="5"
                          fill="#ffffff"
                          stroke={color}
                          strokeWidth="1.5"
                        />
                        <text
                          x={sx}
                          y={yStart - 8}
                          textAnchor="middle"
                          className={`${pFontSize} font-sans font-extrabold tabular-nums`}
                          fill={color}
                        >
                          {pointText}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            } else {
              // UPWARD Point Load: starts below and points UP into bottom of beam (beamY + beamHeight)
              const yStart = beamY + beamHeight + arrowLen;
              const yTip = beamY + beamHeight;
              const color = '#16a34a'; // Bold Green

              return (
                <g key={`point_${load.id}`}>
                  {/* Shaft */}
                  <line
                    x1={sx}
                    y1={yStart}
                    x2={sx}
                    y2={yTip + 8}
                    stroke={color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Explicit Arrowhead pointing UP */}
                  <polygon
                    points={`${sx - 6},${yTip + 9} ${sx + 6},${yTip + 9} ${sx},${yTip}`}
                    fill={color}
                  />
                  {/* Clear Label Badge */}
                  {(() => {
                    const pointText = `${formatNum(Math.abs(load.magnitude), 4)} ${units.force} ↑`;
                    const pBadgeW = Math.max(90, pointText.length * 6.8 + 18);
                    const pFontSize = pointText.length > 16 ? 'text-[10px]' : 'text-[11px]';

                    return (
                      <g>
                        <rect
                          x={sx - pBadgeW / 2}
                          y={yStart + 6}
                          width={pBadgeW}
                          height="20"
                          rx="5"
                          fill="#ffffff"
                          stroke={color}
                          strokeWidth="1.5"
                        />
                        <text
                          x={sx}
                          y={yStart + 20}
                          textAnchor="middle"
                          className={`${pFontSize} font-sans font-extrabold tabular-nums`}
                          fill={color}
                        >
                          {pointText}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            }
          })}

          {/* Supports & Hinges Fixtures */}
          {supports.map((s) => {
            const sx = toSvgX(s.x);

            if (s.type === 'pin') {
              return (
                <g key={`supp_${s.id}`} transform={`translate(${sx}, ${beamY + beamHeight})`}>
                  <circle cx="0" cy="4" r="3.5" fill="#ffffff" stroke="#475569" strokeWidth="2" />
                  <polygon points="0,4 -13,24 13,24" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                  <line x1="-16" y1="24" x2="16" y2="24" stroke="#334155" strokeWidth="2" />
                  <rect x="-16" y="24" width="32" height="7" fill="url(#lightHatch)" />
                </g>
              );
            }

            if (s.type === 'roller') {
              return (
                <g key={`supp_${s.id}`} transform={`translate(${sx}, ${beamY + beamHeight})`}>
                  <circle cx="0" cy="3" r="3" fill="#ffffff" stroke="#475569" strokeWidth="1.5" />
                  <polygon points="0,3 -11,17 11,17" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                  <circle cx="-5.5" cy="21" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
                  <circle cx="5.5" cy="21" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
                  <line x1="-16" y1="25" x2="16" y2="25" stroke="#334155" strokeWidth="2" />
                  <rect x="-16" y="25" width="32" height="7" fill="url(#lightHatch)" />
                </g>
              );
            }

            if (s.type === 'fixed') {
              const isLeft = s.x <= beam.length / 2;
              const wallWidth = 14;
              const wallHeight = 52;
              const wallX = isLeft ? sx - wallWidth : sx;
              const wallY = beamY - (wallHeight - beamHeight) / 2;

              return (
                <g key={`supp_${s.id}`}>
                  <rect
                    x={wallX}
                    y={wallY}
                    width={wallWidth}
                    height={wallHeight}
                    fill="url(#lightHatch)"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={isLeft ? sx : sx}
                    y1={wallY}
                    x2={isLeft ? sx : sx}
                    y2={wallY + wallHeight}
                    stroke="#0f172a"
                    strokeWidth="3.5"
                  />
                </g>
              );
            }

            if (s.type === 'hinge') {
              return (
                <g key={`hinge_${s.id}`} transform={`translate(${sx}, ${beamY + beamHeight / 2})`}>
                  <circle cx="0" cy="0" r="7" fill="#ffffff" stroke="#d97706" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="2" fill="#d97706" />
                  <text
                    x="0"
                    y="-11"
                    textAnchor="middle"
                    className="text-[9px] font-sans font-bold fill-amber-700"
                  >
                    HINGE (M=0)
                  </text>
                </g>
              );
            }

            return null;
          })}

          {/* Support Reactions (Clear Bright Green with Explicit Direction Arrowhead and Generous Clearance) */}
          {reactions.map((r) => {
            const sx = toSvgX(r.x);
            const isUpward = r.Fy >= 0;
            const color = '#16a34a';

            // Position reaction arrows well below the support fixture so they never collide
            const yTop = beamY + beamHeight + 36;
            const yBottom = yTop + 36;

            const reactionText = `R = ${formatNum(Math.abs(r.Fy), 4)} ${units.force} ${isUpward ? '↑' : '↓'}`;
            const rBadgeW = Math.max(96, reactionText.length * 6.5 + 20);
            const rFontSize = reactionText.length > 18 ? 'text-[10px]' : 'text-[11px]';

            const rMomentText = `M_R = ${formatNum(Math.abs(r.M), 4)} ${units.moment}`;
            const rMBadgeW = Math.max(90, rMomentText.length * 6.5 + 20);
            const rMFontSize = rMomentText.length > 18 ? 'text-[9px]' : 'text-[10px]';

            return (
              <g key={`react_${r.supportId}`}>
                {isUpward ? (
                  // UPWARD Reaction: arrow pointing UP into the support base
                  <g>
                    {/* Arrow Shaft */}
                    <line
                      x1={sx}
                      y1={yBottom}
                      x2={sx}
                      y2={yTop + 7}
                      stroke={color}
                      strokeWidth="3"
                    />
                    {/* Explicit Arrowhead pointing UP */}
                    <polygon
                      points={`${sx - 5.5},${yTop + 8} ${sx + 5.5},${yTop + 8} ${sx},${yTop}`}
                      fill={color}
                    />
                    {/* Clear Value Badge below */}
                    <rect
                      x={sx - rBadgeW / 2}
                      y={yBottom + 4}
                      width={rBadgeW}
                      height="20"
                      rx="5"
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                    <text
                      x={sx}
                      y={yBottom + 18}
                      textAnchor="middle"
                      className={`${rFontSize} font-sans font-bold fill-emerald-800 tabular-nums`}
                    >
                      {reactionText}
                    </text>
                  </g>
                ) : (
                  // DOWNWARD Reaction: arrow pointing DOWN away from the support
                  <g>
                    <line
                      x1={sx}
                      y1={yTop}
                      x2={sx}
                      y2={yBottom - 7}
                      stroke={color}
                      strokeWidth="3"
                    />
                    {/* Explicit Arrowhead pointing DOWN */}
                    <polygon
                      points={`${sx - 5.5},${yBottom - 8} ${sx + 5.5},${yBottom - 8} ${sx},${yBottom}`}
                      fill={color}
                    />
                    {/* Value Badge below */}
                    <rect
                      x={sx - rBadgeW / 2}
                      y={yBottom + 4}
                      width={rBadgeW}
                      height="20"
                      rx="5"
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth="1.5"
                    />
                    <text
                      x={sx}
                      y={yBottom + 18}
                      textAnchor="middle"
                      className={`${rFontSize} font-sans font-bold fill-emerald-800 tabular-nums`}
                    >
                      {reactionText}
                    </text>
                  </g>
                )}

                {/* Fixed Support Reaction Moment */}
                {Math.abs(r.M) > 1e-4 && (
                  <g>
                    {/* Clean curved moment arc at fixed end */}
                    <path
                      d={`M ${sx - 18},${beamY - 14} A 22 22 0 0 1 ${sx - 18},${beamY + beamHeight + 14}`}
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                    />
                    {/* Tangent arrowhead showing moment direction */}
                    <polygon
                      points={`${sx - 18},${beamY - 14} ${sx - 26},${beamY - 8} ${sx - 13},${beamY - 6}`}
                      fill={color}
                    />
                    {/* Moment Badge with ample margin */}
                    <rect
                      x={sx - rMBadgeW - 14}
                      y={beamY + beamHeight / 2 - 10}
                      width={rMBadgeW}
                      height="20"
                      rx="5"
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth="1.4"
                    />
                    <text
                      x={sx - rMBadgeW / 2 - 14}
                      y={beamY + beamHeight / 2 + 4}
                      textAnchor="middle"
                      className={`${rMFontSize} font-sans font-bold fill-emerald-800 tabular-nums`}
                    >
                      {rMomentText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Synchronized Hover Cursor Line */}
          {hoverX !== null && (
            <g pointerEvents="none">
              <line
                x1={toSvgX(hoverX)}
                y1={8}
                x2={toSvgX(hoverX)}
                y2={svgHeight - 8}
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <circle
                cx={toSvgX(hoverX)}
                cy={beamY + beamHeight / 2}
                r="4.5"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
