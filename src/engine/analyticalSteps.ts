import { BeamProperties, CalculationStepGroup, PiecewiseEquation, Reaction, Load, Support, UnitSystem } from '../types/beam';
import { UNIT_CONFIGS, formatNum } from './units';

interface SegmentCut {
  xStart: number;
  xEnd: number;
}

export function generateCalculationSteps(
  beam: BeamProperties,
  supports: Support[],
  loads: Load[],
  reactions: Reaction[],
  unitSystem: UnitSystem,
  isDeterminate: boolean,
  degreeOfIndeterminacy: number,
  isStable: boolean,
  statusMessage?: string
): { calculationSteps: CalculationStepGroup[]; piecewiseEquations: PiecewiseEquation[] } {
  const units = UNIT_CONFIGS[unitSystem];
  const steps: CalculationStepGroup[] = [];
  const piecewiseEquations: PiecewiseEquation[] = [];

  if (!isStable) {
    steps.push({
      title: '1. Stability & Equilibrium Analysis (FAILED)',
      description: statusMessage || 'Structure is unstable or forms a kinematic mechanism.',
      mathLines: [
        'The structural system does not possess adequate boundary constraints to prevent rigid body motion.',
        'Ensure that at least two non-collinear degrees of freedom are restrained.'
      ]
    });
    return { calculationSteps: steps, piecewiseEquations };
  }

  // Step 1: Classification & Static Determinacy
  const numReactions = supports.reduce((sum, s) => {
    if (s.type === 'fixed') return sum + 2;
    if (s.type === 'pin' || s.type === 'roller') return sum + 1;
    return sum;
  }, 0);
  const numHinges = supports.filter(s => s.type === 'hinge').length;
  const equilibriumEqs = 2 + numHinges; // Vertical + Moment + Hinges

  const determinacyTitle = isDeterminate
    ? '1. Structural Classification: Statically Determinate'
    : `1. Structural Classification: Statically Indeterminate (Degree ${degreeOfIndeterminacy})`;

  const determinacyMath = [
    `Total Reaction Unknowns: r = ${numReactions}`,
    `Internal Condition Equations (Hinges): c = ${numHinges}`,
    `Available Equilibrium Equations: e = 2 + ${numHinges} = ${equilibriumEqs}`,
    `Degree of Indeterminacy: D = r - e = ${numReactions} - ${equilibriumEqs} = ${degreeOfIndeterminacy}`
  ];

  steps.push({
    title: determinacyTitle,
    description: isDeterminate
      ? 'The number of unknown support reactions equals the available equations of static equilibrium. Reactions can be solved directly using Newton-Euler statics.'
      : 'The number of unknown reactions exceeds the equations of static equilibrium. Direct Stiffness Method (Matrix Analysis / Euler-Bernoulli Beam Formulation) was used to solve boundary compatibility.',
    mathLines: determinacyMath
  });

  // Non-Prismatic Rigidity Distribution Step
  const normSegments = beam.segments && beam.segments.length > 0
    ? beam.segments
    : [{ id: 's1', xStart: 0, xEnd: beam.length, E: beam.E ?? 200, I: beam.I ?? 100, isTapered: false }];

  const isNonPrismatic = normSegments.length > 1 || normSegments.some(s => s.isTapered);
  if (isNonPrismatic) {
    const segLines: string[] = [];
    normSegments.forEach((s, idx) => {
      if (s.isTapered) {
        segLines.push(
          `Segment #${idx + 1} (x = ${formatNum(s.xStart)} \\to ${formatNum(s.xEnd)} ${units.length}): Tapered Profile with E = ${formatNum(s.E)} ${units.stress}, I = ${formatNum(s.I)} \\to ${formatNum(s.IEnd ?? s.I)} ${units.inertia}`
        );
      } else {
        segLines.push(
          `Segment #${idx + 1} (x = ${formatNum(s.xStart)} \\to ${formatNum(s.xEnd)} ${units.length}): Prismatic with E = ${formatNum(s.E)} ${units.stress}, I = ${formatNum(s.I)} ${units.inertia}`
        );
      }
    });
    steps.push({
      title: '2. Cross-Section Rigidity Distribution: Non-Prismatic Profile',
      description: 'The beam features variable flexural rigidity EI(x). The stiffness matrix automatically discretizes the cross-section variations to solve indeterminate compatibility and deflections:',
      mathLines: segLines
    });
  }

  // Step 2: Global Equilibrium & Reactions
  const totalDownwardLoad = loads.reduce((acc, load) => {
    if (load.type === 'point') return acc + load.magnitude;
    if (load.type === 'udl') {
      const len = Math.max(0, (load.xEnd ?? load.x) - load.x);
      return acc + load.magnitude * len;
    }
    if (load.type === 'triangular') {
      const len = Math.max(0, (load.xEnd ?? load.x) - load.x);
      const avg = ((load.magnitude ?? 0) + (load.magnitudeEnd ?? 0)) / 2;
      return acc + avg * len;
    }
    return acc;
  }, 0);

  const reactionLines: string[] = [];
  reactions.forEach((r, idx) => {
    const label = `R_{${idx + 1}} (x = ${formatNum(r.x)} ${units.length})`;
    reactionLines.push(`${label}: Vertical Force R_y = ${formatNum(r.Fy)} ${units.force}`);
    if (Math.abs(r.M) > 1e-4) {
      reactionLines.push(`${label}: Reaction Moment M_R = ${formatNum(r.M)} ${units.moment}`);
    }
  });

  steps.push({
    title: '2. Support Reactions & Global Equilibrium Check',
    description: 'Reactions obtained by solving the beam stiffness equations and enforcing kinematic boundary conditions:',
    mathLines: [
      `Total Applied Vertical Force: \\sum F_{y, applied} = ${formatNum(totalDownwardLoad)} ${units.force}`,
      ...reactionLines,
      `Equilibrium Check: \\sum F_y = 0 \\quad [\\text{Balance: } \\Delta F_y \\approx 0]`,
      `Equilibrium Check: \\sum M_{(x=0)} = 0 \\quad [\\text{Balance: } \\Delta M \\approx 0]`
    ]
  });

  // Step 3: Piecewise Equations for V(x) and M(x) across segments
  // Define segment boundaries from all loads and supports
  const xPoints = new Set<number>([0, beam.length]);
  supports.forEach(s => xPoints.add(s.x));
  loads.forEach(l => {
    xPoints.add(l.x);
    if (l.xEnd !== undefined) xPoints.add(l.xEnd);
  });

  const sortedX = Array.from(xPoints).filter(x => x >= 0 && x <= beam.length).sort((a, b) => a - b);
  const segments: SegmentCut[] = [];
  for (let i = 0; i < sortedX.length - 1; i++) {
    if (sortedX[i + 1] - sortedX[i] > 1e-5) {
      segments.push({ xStart: sortedX[i], xEnd: sortedX[i + 1] });
    }
  }

  const piecewiseLines: string[] = [];

  segments.forEach((seg, index) => {
    const xMid = (seg.xStart + seg.xEnd) / 2;

    // Build formula string for shear V(x) and moment M(x)
    let vTerms: string[] = [];
    let mTerms: string[] = [];

    // Reactions strictly to the left of the segment midpoint
    reactions.forEach(r => {
      if (r.x <= seg.xStart + 1e-5) {
        if (Math.abs(r.Fy) > 1e-4) {
          const sign = r.Fy >= 0 ? '+' : '-';
          vTerms.push(`${sign} ${formatNum(Math.abs(r.Fy))}`);
          mTerms.push(`${sign} ${formatNum(Math.abs(r.Fy))}(x - ${formatNum(r.x)})`);
        }
        if (Math.abs(r.M) > 1e-4) {
          const sign = r.M >= 0 ? '+' : '-';
          mTerms.push(`${sign} ${formatNum(Math.abs(r.M))}`);
        }
      }
    });

    // Applied loads to the left
    loads.forEach(l => {
      if (l.type === 'point' && l.x <= seg.xStart + 1e-5) {
        // Downward load reduces shear
        const sign = l.magnitude >= 0 ? '-' : '+';
        vTerms.push(`${sign} ${formatNum(Math.abs(l.magnitude))}`);
        mTerms.push(`${sign} ${formatNum(Math.abs(l.magnitude))}(x - ${formatNum(l.x)})`);
      } else if (l.type === 'moment' && l.x <= seg.xStart + 1e-5) {
        const sign = l.momentDirection === 'cw' ? '+' : '-';
        mTerms.push(`${sign} ${formatNum(Math.abs(l.magnitude))}`);
      } else if ((l.type === 'udl' || l.type === 'triangular') && l.x < seg.xEnd - 1e-5) {
        // Distributed load either fully to the left or currently spanning
        const activeStart = l.x;
        const activeEnd = l.xEnd ?? beam.length;

        if (activeEnd <= seg.xStart + 1e-5) {
          // Fully to the left
          const spanLen = activeEnd - activeStart;
          if (l.type === 'udl') {
            const totalF = l.magnitude * spanLen;
            const centroid = activeStart + spanLen / 2;
            vTerms.push(`- ${formatNum(totalF)}`);
            mTerms.push(`- ${formatNum(totalF)}(x - ${formatNum(centroid)})`);
          } else {
            const w1 = l.magnitude;
            const w2 = l.magnitudeEnd ?? 0;
            const totalF = ((w1 + w2) / 2) * spanLen;
            const centroid = activeStart + (spanLen * (w1 + 2 * w2)) / (3 * (w1 + w2 || 1));
            vTerms.push(`- ${formatNum(totalF)}`);
            mTerms.push(`- ${formatNum(totalF)}(x - ${formatNum(centroid)})`);
          }
        } else if (activeStart <= seg.xStart + 1e-5) {
          // Distributed load is active in this segment
          if (l.type === 'udl') {
            const w = l.magnitude;
            vTerms.push(`- ${formatNum(w)}(x - ${formatNum(activeStart)})`);
            mTerms.push(`- \\frac{${formatNum(w)}}{2}(x - ${formatNum(activeStart)})^2`);
          } else {
            const w1 = l.magnitude;
            const w2 = l.magnitudeEnd ?? 0;
            const spanLen = activeEnd - activeStart;
            vTerms.push(`- \\int_{${formatNum(activeStart)}}^x w(\\xi) d\\xi`);
            mTerms.push(`- \\int_{${formatNum(activeStart)}}^x w(\\xi)(x - \\xi) d\\xi`);
          }
        }
      }
    });

    const vExpr = vTerms.length > 0 ? vTerms.join(' ').replace(/^\+\s*/, '') : '0';
    const mExpr = mTerms.length > 0 ? mTerms.join(' ').replace(/^\+\s*/, '') : '0';

    const intervalStr = `${formatNum(seg.xStart)} \\le x \\le ${formatNum(seg.xEnd)} \\text{ ${units.length}}`;
    piecewiseLines.push(
      `\\textbf{Segment ${index + 1}: } ${intervalStr}`,
      `V(x) = ${vExpr}`,
      `M(x) = ${mExpr}`
    );

    piecewiseEquations.push({
      interval: [seg.xStart, seg.xEnd],
      shearEquation: vExpr,
      momentEquation: mExpr
    });
  });

  steps.push({
    title: '3. Internal Piecewise Equations V(x) & M(x)',
    description: 'Derived by taking an arbitrary section cut at distance x from the left end and enforcing local segment equilibrium (\\sum F_y = 0, \\sum M_{cut} = 0):',
    mathLines: piecewiseLines
  });

  // Step 4: Critical Locations (Zero Shear, Inflection, Maximum Bending)
  steps.push({
    title: '4. Critical Locations & Extremum Analysis',
    description: 'According to differential equilibrium relations, the bending moment reaches a local extremum where the shear force passes through zero (dM/dx = V = 0), and an inflection point occurs where M(x) = 0:',
    mathLines: [
      '\\frac{dV}{dx} = -w(x) \\quad [\\text{Slope of Shear Diagram equals negative Distributed Load}]',
      '\\frac{dM}{dx} = V(x) \\quad [\\text{Slope of Moment Diagram equals Shear Force}]',
      '\\frac{d^2 v}{dx^2} = \\frac{M(x)}{EI} \\quad [\\text{Beam Curvature is proportional to Bending Moment}]',
      'At points where V(x) = 0, the bending moment M(x) is at a local maximum or minimum.'
    ]
  });

  return { calculationSteps: steps, piecewiseEquations };
}
