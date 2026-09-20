export type UnitSystem = 'metric' | 'imperial';

export type SupportType = 'pin' | 'roller' | 'fixed' | 'hinge';

export interface Support {
  id: string;
  type: SupportType;
  x: number; // in m or ft
}

export type LoadType = 'point' | 'udl' | 'triangular' | 'moment';

export interface Load {
  id: string;
  type: LoadType;
  x: number; // start location
  xEnd?: number; // end location for UDL/triangular
  magnitude: number; // Force (kN or kip), or w1 (kN/m or kip/ft), or Moment (kNm or kip-ft)
  magnitudeEnd?: number; // w2 for triangular/trapezoidal
  momentDirection?: 'cw' | 'ccw'; // for moment loads
}

export interface BeamSegment {
  id: string;
  xStart: number;
  xEnd: number;
  E: number;          // GPa or ksi
  I: number;          // 10^6 mm^4 or in^4 (constant I, or I_start if tapered)
  isTapered?: boolean;
  IEnd?: number;      // 10^6 mm^4 or in^4 (I_end if tapered)
}

export interface BeamProperties {
  length: number; // m or ft
  E?: number;     // GPa or ksi (legacy fallback)
  I?: number;     // 10^6 mm^4 or in^4 (legacy fallback)
  segments?: BeamSegment[];
}

export type SignConvention = 'standard' | 'tension_side';

export interface Reaction {
  supportId: string;
  type: SupportType;
  x: number;
  Fy: number; // Vertical reaction (kN or kip, positive = upward)
  M: number;  // Reaction moment at fixed support (kNm or kip-ft, positive = counter-clockwise)
}

export interface DiagramPoint {
  x: number;
  shear: number;       // V(x)
  moment: number;      // M(x)
  deflection: number;  // v(x) (mm or inches)
  slope: number;       // theta(x) (rad)
  E?: number;          // local E(x)
  I?: number;          // local I(x)
}

export interface CriticalPoint {
  x: number;
  type: 'zero_shear' | 'inflection' | 'support' | 'load' | 'max_deflection';
  label: string;
  value?: number;
}

export interface PiecewiseEquation {
  interval: [number, number]; // [x_start, x_end]
  shearEquation: string;
  momentEquation: string;
}

export interface CalculationStepGroup {
  title: string;
  description: string;
  mathLines?: string[];
  substeps?: string[];
}

export interface InternalHingeResult {
  supportId: string;
  x: number;
  deflection: number; // Delta_y at hinge (mm or in)
  thetaLeft: number;  // theta_L in rad
  thetaRight: number; // theta_R in rad
  deltaTheta: number; // Delta theta = theta_R - theta_L in rad
}

export interface AnalysisResult {
  isStable: boolean;
  statusMessage?: string;
  isDeterminate: boolean;
  degreeOfIndeterminacy: number;
  reactions: Reaction[];
  diagramPoints: DiagramPoint[];
  maxShear: { value: number; x: number };
  minShear: { value: number; x: number };
  maxAbsShear: { value: number; x: number };
  maxMoment: { value: number; x: number };
  minMoment: { value: number; x: number };
  maxAbsMoment: { value: number; x: number };
  maxDeflection: { value: number; x: number };
  minDeflection: { value: number; x: number };
  maxAbsDeflection: { value: number; x: number };
  equilibriumCheck: {
    sumFy: number;
    sumM: number;
    isBalanced: boolean;
  };
  criticalPoints: CriticalPoint[];
  piecewiseEquations: PiecewiseEquation[];
  calculationSteps: CalculationStepGroup[];
  internalHinges?: InternalHingeResult[];
}

export interface PresetBeam {
  id: string;
  name: string;
  description: string;
  beam: BeamProperties;
  supports: Support[];
  loads: Load[];
}
