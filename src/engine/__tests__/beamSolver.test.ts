import { describe, it, expect } from 'vitest';
import { analyzeBeam } from '../beamSolver';
import { BeamProperties, Support, Load } from '../../types/beam';

describe('Beam Structural Analysis Engine', () => {
  it('correctly calculates simply supported beam with central point load', () => {
    const beam: BeamProperties = { length: 6, E: 200, I: 100 };
    const supports: Support[] = [
      { id: '1', type: 'pin', x: 0 },
      { id: '2', type: 'roller', x: 6 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'point', x: 3, magnitude: 50 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');

    expect(res.isStable).toBe(true);
    expect(res.isDeterminate).toBe(true);
    expect(res.degreeOfIndeterminacy).toBe(0);

    // Reactions: Ra = Rb = 25 kN
    const rA = res.reactions.find(r => Math.abs(r.x - 0) < 1e-4);
    const rB = res.reactions.find(r => Math.abs(r.x - 6) < 1e-4);
    expect(rA).toBeDefined();
    expect(rB).toBeDefined();
    expect(rA!.Fy).toBeCloseTo(25, 3);
    expect(rB!.Fy).toBeCloseTo(25, 3);

    // Equilibrium
    expect(res.equilibriumCheck.isBalanced).toBe(true);

    // Max Bending Moment: P*L/4 = 50*6/4 = 75 kNm at x = 3
    expect(res.maxAbsMoment.value).toBeCloseTo(75, 2);
    expect(res.maxAbsMoment.x).toBeCloseTo(3, 2);

    // Max Deflection: P*L^3 / (48*E*I) = 50 * 216 / (48 * 20000) = 0.01125 m = 11.25 mm downward
    expect(res.maxAbsDeflection.value).toBeCloseTo(11.25, 1);
    expect(res.maxAbsDeflection.x).toBeCloseTo(3, 1);
  });

  it('correctly calculates simply supported beam with full UDL', () => {
    const beam: BeamProperties = { length: 8, E: 200, I: 120 };
    const supports: Support[] = [
      { id: '1', type: 'pin', x: 0 },
      { id: '2', type: 'roller', x: 8 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'udl', x: 0, xEnd: 8, magnitude: 20 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(true);

    // Reactions: Ra = Rb = w*L/2 = 20*8/2 = 80 kN
    const rA = res.reactions.find(r => Math.abs(r.x - 0) < 1e-4);
    const rB = res.reactions.find(r => Math.abs(r.x - 8) < 1e-4);
    expect(rA!.Fy).toBeCloseTo(80, 3);
    expect(rB!.Fy).toBeCloseTo(80, 3);

    // Max Moment: w*L^2/8 = 20*64/8 = 160 kNm at x = 4
    expect(res.maxAbsMoment.value).toBeCloseTo(160, 2);
    expect(res.maxAbsMoment.x).toBeCloseTo(4, 2);

    // Max Deflection: 5*w*L^4 / (384*E*I) = 5*20*4096 / (384 * 24000) = 44.44 mm
    expect(res.maxAbsDeflection.value).toBeCloseTo(44.44, 1);
    expect(res.maxAbsDeflection.x).toBeCloseTo(4, 1);
  });

  it('correctly calculates cantilever beam with tip point load', () => {
    const beam: BeamProperties = { length: 4, E: 200, I: 80 };
    const supports: Support[] = [
      { id: '1', type: 'fixed', x: 0 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'point', x: 4, magnitude: 30 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(true);
    expect(res.reactions.length).toBe(1);

    const rFixed = res.reactions[0];
    expect(rFixed.Fy).toBeCloseTo(30, 3);
    // CCW reaction moment: M = 30 * 4 = 120 kNm
    expect(Math.abs(rFixed.M)).toBeCloseTo(120, 2);

    // Max deflection at tip: P*L^3 / (3*E*I) = 30 * 64 / (3 * 16000) = 0.04 m = 40 mm
    expect(res.maxAbsDeflection.value).toBeCloseTo(40, 1);
    expect(res.maxAbsDeflection.x).toBeCloseTo(4, 1);
  });

  it('correctly calculates statically indeterminate propped cantilever', () => {
    const beam: BeamProperties = { length: 6, E: 200, I: 100 };
    const supports: Support[] = [
      { id: '1', type: 'fixed', x: 0 },
      { id: '2', type: 'roller', x: 6 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'udl', x: 0, xEnd: 6, magnitude: 16 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(true);
    expect(res.degreeOfIndeterminacy).toBe(1);

    // Theoretical:
    // Roller reaction at x=6: Rb = 3/8 * w * L = 3/8 * 16 * 6 = 36 kN
    // Fixed vertical at x=0: Ra = 5/8 * w * L = 5/8 * 16 * 6 = 60 kN
    // Fixed moment at x=0: M = w*L^2/8 = 16*36/8 = 72 kNm
    const rRoller = res.reactions.find(r => Math.abs(r.x - 6) < 1e-4);
    const rFixed = res.reactions.find(r => Math.abs(r.x - 0) < 1e-4);

    expect(rRoller!.Fy).toBeCloseTo(36, 2);
    expect(rFixed!.Fy).toBeCloseTo(60, 2);
    expect(Math.abs(rFixed!.M)).toBeCloseTo(72, 2);
    expect(res.equilibriumCheck.isBalanced).toBe(true);
  });

  it('correctly calculates indeterminate degree 2 fixed-fixed beam', () => {
    const beam: BeamProperties = { length: 6, E: 200, I: 100 };
    const supports: Support[] = [
      { id: '1', type: 'fixed', x: 0 },
      { id: '2', type: 'fixed', x: 6 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'point', x: 3, magnitude: 60 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(true);
    expect(res.degreeOfIndeterminacy).toBe(2);

    // End reactions: Ra = Rb = 30 kN, End moments = P*L/8 = 60*6/8 = 45 kNm
    const r1 = res.reactions.find(r => Math.abs(r.x - 0) < 1e-4);
    const r2 = res.reactions.find(r => Math.abs(r.x - 6) < 1e-4);

    expect(r1!.Fy).toBeCloseTo(30, 2);
    expect(r2!.Fy).toBeCloseTo(30, 2);
    expect(Math.abs(r1!.M)).toBeCloseTo(45, 2);
    expect(Math.abs(r2!.M)).toBeCloseTo(45, 2);

    // Max deflection: P*L^3 / (192*E*I) = 60 * 216 / (192 * 20000) = 0.003375 m = 3.375 mm
    expect(res.maxAbsDeflection.value).toBeCloseTo(3.375, 1);
  });

  it('correctly analyzes beam with internal hinge (zero moment at hinge)', () => {
    const beam: BeamProperties = { length: 8, E: 200, I: 100 };
    const supports: Support[] = [
      { id: '1', type: 'fixed', x: 0 },
      { id: '2', type: 'hinge', x: 4 },
      { id: '3', type: 'roller', x: 8 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'udl', x: 0, xEnd: 8, magnitude: 15 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(true);

    // Bending moment at hinge (x = 4) must be zero
    const ptHinge = res.diagramPoints.find(p => Math.abs(p.x - 4) < 1e-4);
    expect(ptHinge).toBeDefined();
    expect(Math.abs(ptHinge!.moment)).toBeLessThan(1e-3);
    expect(res.equilibriumCheck.isBalanced).toBe(true);
  });

  it('detects unstable single roller support', () => {
    const beam: BeamProperties = { length: 6, E: 200, I: 100 };
    const supports: Support[] = [
      { id: '1', type: 'roller', x: 3 }
    ];
    const loads: Load[] = [
      { id: '1', type: 'point', x: 3, magnitude: 20 }
    ];

    const res = analyzeBeam(beam, supports, loads, 'metric');
    expect(res.isStable).toBe(false);
    expect(res.statusMessage).toContain('Insufficient supports');
  });
});
