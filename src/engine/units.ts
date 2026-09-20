import { UnitSystem, BeamSegment, BeamProperties } from '../types/beam';

export interface UnitConfig {
  length: string;
  force: string;
  distLoad: string;
  moment: string;
  stress: string;
  inertia: string;
  deflection: string;
}

export const UNIT_CONFIGS: Record<UnitSystem, UnitConfig> = {
  metric: {
    length: 'm',
    force: 'kN',
    distLoad: 'kN/m',
    moment: 'kN·m',
    stress: 'GPa',
    inertia: '10⁶ mm⁴',
    deflection: 'mm',
  },
  imperial: {
    length: 'ft',
    force: 'kip',
    distLoad: 'kip/ft',
    moment: 'kip·ft',
    stress: 'ksi',
    inertia: 'in⁴',
    deflection: 'in',
  },
};

/**
 * Calculates EI in base simulation units (Force * Length^2)
 * In Metric: E in GPa (10^6 kN/m^2), I in 10^6 mm^4 (10^-6 m^4)
 * EI = E * 10^6 * I * 10^-6 = E * I [kN·m^2]
 *
 * In Imperial: E in ksi (kip/in^2), I in in^4
 * EI = E * I [kip·in^2]
 * To convert to [kip·ft^2]: divide by 144
 */
export function calculateEI(E: number, I: number, system: UnitSystem): number {
  if (system === 'metric') {
    return E * I; // kN·m^2
  } else {
    return (E * I) / 144; // kip·ft^2
  }
}

/**
 * Converts internal deflection (in length units: m or ft) to display units (mm or in)
 */
export function formatDeflection(value: number, system: UnitSystem): number {
  if (system === 'metric') {
    return value * 1000; // m -> mm
  } else {
    return value * 12; // ft -> in
  }
}

/**
 * Convert value between Metric and Imperial
 */
export function convertLength(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 3.28084 : val / 3.28084;
}

export function convertForce(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 0.224809 : val / 0.224809;
}

export function convertDistLoad(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 0.0685218 : val / 0.0685218;
}

export function convertMoment(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 0.737562 : val / 0.737562;
}

export function convertE(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 145.038 : val / 145.038;
}

export function convertI(val: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return val;
  return from === 'metric' ? val * 2.40251 : val / 2.40251;
}

/**
 * Converts all beam segments between Metric and Imperial
 */
export function convertBeamSegments(
  segments: BeamSegment[],
  from: UnitSystem,
  to: UnitSystem
): BeamSegment[] {
  if (from === to) return segments;
  return segments.map((seg) => ({
    ...seg,
    xStart: convertLength(seg.xStart, from, to),
    xEnd: convertLength(seg.xEnd, from, to),
    E: convertE(seg.E, from, to),
    I: convertI(seg.I, from, to),
    IEnd: seg.IEnd !== undefined ? convertI(seg.IEnd, from, to) : undefined
  }));
}

/**
 * Ensures beam has at least one valid segment, converting legacy E/I if needed
 */
export function normalizeBeamSegments(beam: BeamProperties): BeamSegment[] {
  if (beam.segments && beam.segments.length > 0) {
    return beam.segments;
  }
  const defaultE = beam.E ?? 200;
  const defaultI = beam.I ?? 100;
  return [
    {
      id: 'seg_default_1',
      xStart: 0,
      xEnd: beam.length,
      E: defaultE,
      I: defaultI,
      isTapered: false
    }
  ];
}

/**
 * Format numbers with strictly enforced precision (minimum 4 decimal places).
 * Trailing zeros are preserved to maintain exact display precision.
 */
export function formatNum(num: number, decimals: number = 4): string {
  if (isNaN(num) || !isFinite(num)) return (0).toFixed(decimals);
  if (Math.abs(num) < 1e-12) return (0).toFixed(decimals);

  // Use scientific notation only for astronomically large or microscopic non-zero numbers
  if (Math.abs(num) >= 1e8 || (Math.abs(num) < 1e-6 && Math.abs(num) > 0)) {
    return num.toExponential(decimals);
  }

  let fixed = num.toFixed(decimals);
  // Guard against '-0.0000'
  if (fixed === `-${(0).toFixed(decimals)}`) {
    fixed = (0).toFixed(decimals);
  }
  return fixed;
}
