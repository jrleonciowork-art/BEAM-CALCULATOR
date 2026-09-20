import {
  BeamProperties,
  BeamSegment,
  Support,
  Load,
  UnitSystem,
  AnalysisResult,
  Reaction,
  DiagramPoint,
  CriticalPoint
} from '../types/beam';
import { Matrix } from './matrix';
import { calculateEI, formatDeflection, normalizeBeamSegments } from './units';
import { generateCalculationSteps } from './analyticalSteps';

interface NodeData {
  x: number;
  isHinge: boolean;
  support?: Support;
  vDof: number;
  thetaDof?: number;
  thetaLeftDof?: number;
  thetaRightDof?: number;
}

/**
 * Evaluates the cross-section properties at coordinate x along the beam segments
 */
export function getBeamSectionAt(
  segments: BeamSegment[],
  x: number,
  unitSystem: UnitSystem
): { E: number; I: number; EI: number; segment: BeamSegment } {
  if (!segments || segments.length === 0) {
    const fallbackEI = calculateEI(200, 100, unitSystem);
    return {
      E: 200,
      I: 100,
      EI: fallbackEI,
      segment: { id: 'fallback', xStart: 0, xEnd: 10, E: 200, I: 100 }
    };
  }

  // Find segment containing x
  let found = segments.find(
    (s) => x >= s.xStart - 1e-7 && x <= s.xEnd + 1e-7
  );

  if (!found) {
    if (x < segments[0].xStart) {
      found = segments[0];
    } else {
      found = segments[segments.length - 1];
    }
  }

  let localI = found.I;
  if (found.isTapered && found.IEnd !== undefined) {
    const segLen = Math.max(1e-7, found.xEnd - found.xStart);
    const t = Math.max(0, Math.min(1, (x - found.xStart) / segLen));
    localI = found.I + (found.IEnd - found.I) * t;
  }

  const localE = found.E;
  const localEI = calculateEI(localE, localI, unitSystem);

  return {
    E: localE,
    I: localI,
    EI: localEI,
    segment: found
  };
}

export function analyzeBeam(
  beam: BeamProperties,
  supports: Support[],
  loads: Load[],
  unitSystem: UnitSystem
): AnalysisResult {
  const emptyResult: AnalysisResult = {
    isStable: false,
    statusMessage: '',
    isDeterminate: true,
    degreeOfIndeterminacy: 0,
    reactions: [],
    diagramPoints: [],
    maxShear: { value: 0, x: 0 },
    minShear: { value: 0, x: 0 },
    maxAbsShear: { value: 0, x: 0 },
    maxMoment: { value: 0, x: 0 },
    minMoment: { value: 0, x: 0 },
    maxAbsMoment: { value: 0, x: 0 },
    maxDeflection: { value: 0, x: 0 },
    minDeflection: { value: 0, x: 0 },
    maxAbsDeflection: { value: 0, x: 0 },
    equilibriumCheck: { sumFy: 0, sumM: 0, isBalanced: false },
    criticalPoints: [],
    piecewiseEquations: [],
    calculationSteps: []
  };

  // 1. Basic validation
  if (!beam || beam.length <= 0) {
    emptyResult.statusMessage = 'Beam length must be strictly greater than 0.';
    return emptyResult;
  }

  const segments = normalizeBeamSegments(beam);

  // Validate non-prismatic beam segments
  for (const seg of segments) {
    if (!seg.E || seg.E <= 0) {
      emptyResult.statusMessage = 'Elastic modulus (E) must be positive for all segments.';
      return emptyResult;
    }
    if (!seg.I || seg.I <= 0 || (seg.isTapered && (!seg.IEnd || seg.IEnd <= 0))) {
      emptyResult.statusMessage = 'Moment of inertia (I) must be positive for all segments.';
      return emptyResult;
    }
    if (seg.xEnd <= seg.xStart) {
      emptyResult.statusMessage = 'Segment length must be greater than 0 (xEnd > xStart).';
      return emptyResult;
    }
  }

  // Filter out any supports or loads beyond beam length
  const validSupports = supports.filter(s => s.x >= -1e-7 && s.x <= beam.length + 1e-7);
  const actualSupports = validSupports.filter(s => s.type !== 'hinge');
  const hinges = validSupports.filter(s => s.type === 'hinge');

  if (actualSupports.length === 0) {
    emptyResult.statusMessage = 'No supports detected. The beam is completely unsupported and unstable.';
    emptyResult.calculationSteps = generateCalculationSteps(
      beam, validSupports, loads, [], unitSystem, true, 0, false, emptyResult.statusMessage
    ).calculationSteps;
    return emptyResult;
  }

  // Check trivial instability (e.g. single roller support)
  const totalVerticalRestraints = actualSupports.length;
  const fixedSupports = actualSupports.filter(s => s.type === 'fixed');
  const hasFixed = fixedSupports.length > 0;

  if (totalVerticalRestraints < 2 && !hasFixed) {
    emptyResult.statusMessage = 'Insufficient supports: Single pin or roller cannot prevent rotational rigid body motion.';
    emptyResult.calculationSteps = generateCalculationSteps(
      beam, validSupports, loads, [], unitSystem, true, 0, false, emptyResult.statusMessage
    ).calculationSteps;
    return emptyResult;
  }

  // 2. Identify all key coordinates along the beam (supports, loads, segment boundaries, and discretization)
  const xCoordSet = new Set<number>();
  xCoordSet.add(0);
  xCoordSet.add(beam.length);

  // Segment transition nodes and tapered discretization sub-elements
  segments.forEach(seg => {
    if (seg.xStart >= 0 && seg.xStart <= beam.length) xCoordSet.add(seg.xStart);
    if (seg.xEnd >= 0 && seg.xEnd <= beam.length) xCoordSet.add(seg.xEnd);

    // If tapered, discretize into 16 sub-elements for high-precision finite element convergence
    if (seg.isTapered && seg.IEnd !== undefined && Math.abs(seg.IEnd - seg.I) > 1e-6) {
      const numSub = 16;
      const dX = (seg.xEnd - seg.xStart) / numSub;
      for (let s = 1; s < numSub; s++) {
        const subX = seg.xStart + s * dX;
        if (subX >= 0 && subX <= beam.length) {
          xCoordSet.add(subX);
        }
      }
    }
  });

  validSupports.forEach(s => {
    if (s.x >= 0 && s.x <= beam.length) xCoordSet.add(s.x);
  });

  loads.forEach(l => {
    if (l.x >= 0 && l.x <= beam.length) xCoordSet.add(l.x);
    if (l.xEnd !== undefined && l.xEnd >= 0 && l.xEnd <= beam.length) {
      xCoordSet.add(l.xEnd);
    }
  });

  const sortedCoords = Array.from(xCoordSet).sort((a, b) => a - b);
  // Ensure we have distinct coordinates
  const distinctCoords: number[] = [];
  sortedCoords.forEach(c => {
    if (distinctCoords.length === 0 || Math.abs(c - distinctCoords[distinctCoords.length - 1]) > 1e-6) {
      distinctCoords.push(c);
    }
  });

  // 3. Build Nodes and Assign Degrees of Freedom
  let currentDof = 0;
  const nodes: NodeData[] = [];

  for (let i = 0; i < distinctCoords.length; i++) {
    const x = distinctCoords[i];
    const isHinge = hinges.some(h => Math.abs(h.x - x) < 1e-5);
    const supp = actualSupports.find(s => Math.abs(s.x - x) < 1e-5);

    const nodeData: NodeData = {
      x,
      isHinge,
      support: supp,
      vDof: currentDof++
    };

    if (isHinge) {
      nodeData.thetaLeftDof = currentDof++;
      nodeData.thetaRightDof = currentDof++;
    } else {
      nodeData.thetaDof = currentDof++;
    }

    nodes.push(nodeData);
  }

  const totalDofs = currentDof;
  const K = Matrix.create(totalDofs, totalDofs, 0);
  const F = new Array(totalDofs).fill(0);

  // 4. Element Assembly
  const numElements = nodes.length - 1;
  const elementEIs: number[] = new Array(numElements).fill(0);

  for (let e = 0; e < numElements; e++) {
    const n1 = nodes[e];
    const n2 = nodes[e + 1];
    const Le = n2.x - n1.x;

    if (Le <= 1e-7) continue;

    // Evaluate local EI at element midpoint
    const midX = (n1.x + n2.x) / 2;
    const sec = getBeamSectionAt(segments, midX, unitSystem);
    const EI_e = sec.EI;
    elementEIs[e] = EI_e;

    // Determine DOFs for this element: [v1, theta1, v2, theta2]
    const dof_v1 = n1.vDof;
    const dof_t1 = n1.isHinge ? n1.thetaRightDof! : n1.thetaDof!;
    const dof_v2 = n2.vDof;
    const dof_t2 = n2.isHinge ? n2.thetaLeftDof! : n2.thetaDof!;

    const elemDofs = [dof_v1, dof_t1, dof_v2, dof_t2];

    // Local 4x4 stiffness matrix
    const L2 = Le * Le;
    const L3 = L2 * Le;
    const k11 = (12 * EI_e) / L3;
    const k12 = (6 * EI_e) / L2;
    const k22 = (4 * EI_e) / Le;
    const k24 = (2 * EI_e) / Le;

    const ke = [
      [ k11,  k12, -k11,  k12],
      [ k12,  k22, -k12,  k24],
      [-k11, -k12,  k11, -k12],
      [ k12,  k24, -k12,  k22]
    ];

    // Assemble into global K
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        K[elemDofs[r]][elemDofs[c]] += ke[r][c];
      }
    }

    // Equivalent nodal loads from distributed loads acting on this element
    loads.forEach(load => {
      if (load.type === 'udl' || load.type === 'triangular') {
        const loadStart = load.x;
        const loadEnd = load.xEnd ?? beam.length;

        // Check if load overlaps this element
        const overlapStart = Math.max(n1.x, loadStart);
        const overlapEnd = Math.min(n2.x, loadEnd);

        if (overlapEnd - overlapStart > 1e-6) {
          // Calculate w at element endpoints n1.x and n2.x
          const totalLoadSpan = Math.max(1e-6, loadEnd - loadStart);
          const wStart = load.magnitude;
          const wEnd = load.type === 'triangular' ? (load.magnitudeEnd ?? 0) : load.magnitude;

          const w1 = wStart + (wEnd - wStart) * ((n1.x - loadStart) / totalLoadSpan);
          const w2 = wStart + (wEnd - wStart) * ((n2.x - loadStart) / totalLoadSpan);

          // Uniform component (w1) and triangular component (deltaW = w2 - w1)
          const wu = w1;
          const dw = w2 - w1;

          // Downward load in standard convention (positive = downward)
          // Consistent nodal load vector in upward (+y) direction and CCW moment:
          const f_v1 = -(wu * Le / 2 + 3 * dw * Le / 20);
          const f_t1 = -(wu * L2 / 12 + dw * L2 / 30);
          const f_v2 = -(wu * Le / 2 + 7 * dw * Le / 20);
          const f_t2 = +(wu * L2 / 12 + dw * L2 / 20);

          F[dof_v1] += f_v1;
          F[dof_t1] += f_t1;
          F[dof_v2] += f_v2;
          F[dof_t2] += f_t2;
        }
      }
    });
  }

  // Direct nodal loads (Point loads & Moments)
  loads.forEach(load => {
    if (load.type === 'point') {
      const node = nodes.find(n => Math.abs(n.x - load.x) < 1e-5);
      if (node) {
        // Downward load reduces vertical force (+y is up)
        F[node.vDof] -= load.magnitude;
      }
    } else if (load.type === 'moment') {
      const node = nodes.find(n => Math.abs(n.x - load.x) < 1e-5);
      if (node) {
        // Sign: CCW is positive moment (+ theta), CW is negative
        const sign = load.momentDirection === 'cw' ? -1 : 1;
        const momVal = load.magnitude * sign;
        if (node.isHinge) {
          F[node.thetaLeftDof!] += momVal;
        } else {
          F[node.thetaDof!] += momVal;
        }
      }
    }
  });

  // 5. Boundary Conditions (Restraints)
  const isConstrained = new Array(totalDofs).fill(false);
  nodes.forEach(node => {
    if (node.support) {
      if (node.support.type === 'pin' || node.support.type === 'roller') {
        isConstrained[node.vDof] = true;
      } else if (node.support.type === 'fixed') {
        isConstrained[node.vDof] = true;
        if (node.thetaDof !== undefined) {
          isConstrained[node.thetaDof] = true;
        }
      }
    }
  });

  const freeDofs: number[] = [];
  const fixedDofs: number[] = [];
  for (let i = 0; i < totalDofs; i++) {
    if (isConstrained[i]) {
      fixedDofs.push(i);
    } else {
      freeDofs.push(i);
    }
  }

  // Check degree of indeterminacy
  const numReactionsCount = fixedDofs.length;
  const numHingesCount = hinges.length;
  const degIndet = Math.max(0, numReactionsCount - (2 + numHingesCount));
  const isDeterminate = numReactionsCount === (2 + numHingesCount);

  // Partition K_ff and F_f
  const nFree = freeDofs.length;
  const Kff = Matrix.create(nFree, nFree, 0);
  const Ff = new Array(nFree).fill(0);

  for (let r = 0; r < nFree; r++) {
    const dofR = freeDofs[r];
    Ff[r] = F[dofR];
    for (let c = 0; c < nFree; c++) {
      const dofC = freeDofs[c];
      Kff[r][c] = K[dofR][dofC];
    }
  }

  const Df = Matrix.solve(Kff, Ff);
  if (!Df) {
    emptyResult.statusMessage = 'Unstable structure: Global stiffness matrix is singular. Check for insufficient supports or improper hinge locations.';
    emptyResult.calculationSteps = generateCalculationSteps(
      beam, validSupports, loads, [], unitSystem, isDeterminate, degIndet, false, emptyResult.statusMessage
    ).calculationSteps;
    return emptyResult;
  }

  // Full displacement vector D
  const D = new Array(totalDofs).fill(0);
  for (let i = 0; i < nFree; i++) {
    D[freeDofs[i]] = Df[i];
  }

  // 6. Calculate Support Reactions
  // R = K * D - F_applied_equivalent
  const KD = Matrix.multiplyVector(K, D);
  const reactions: Reaction[] = [];

  nodes.forEach(node => {
    if (node.support) {
      const rFy = KD[node.vDof] - F[node.vDof];
      let rM = 0;
      if (node.support.type === 'fixed' && node.thetaDof !== undefined) {
        rM = KD[node.thetaDof] - F[node.thetaDof];
      }

      reactions.push({
        supportId: node.support.id,
        type: node.support.type,
        x: node.x,
        Fy: rFy,
        M: rM
      });
    }
  });

  // 7. Equilibrium Verification
  let sumFyReactions = 0;
  let sumMReactions = 0;
  reactions.forEach(r => {
    sumFyReactions += r.Fy;
    sumMReactions += r.Fy * r.x + r.M;
  });

  let sumFyApplied = 0;
  let sumMApplied = 0;
  loads.forEach(load => {
    if (load.type === 'point') {
      sumFyApplied += load.magnitude;
      sumMApplied += load.magnitude * load.x;
    } else if (load.type === 'moment') {
      const sign = load.momentDirection === 'cw' ? -1 : 1;
      sumMApplied -= load.magnitude * sign;
    } else if (load.type === 'udl') {
      const len = Math.max(0, (load.xEnd ?? beam.length) - load.x);
      const totalF = load.magnitude * len;
      const xCentroid = load.x + len / 2;
      sumFyApplied += totalF;
      sumMApplied += totalF * xCentroid;
    } else if (load.type === 'triangular') {
      const len = Math.max(0, (load.xEnd ?? beam.length) - load.x);
      const w1 = load.magnitude;
      const w2 = load.magnitudeEnd ?? 0;
      const totalF = ((w1 + w2) / 2) * len;
      const xCentroid = len > 0 ? load.x + (len * (w1 + 2 * w2)) / (3 * (w1 + w2 || 1)) : load.x;
      sumFyApplied += totalF;
      sumMApplied += totalF * xCentroid;
    }
  });

  const deltaFy = Math.abs(sumFyReactions - sumFyApplied);
  const deltaM = Math.abs(sumMReactions - sumMApplied);
  const isBalanced = deltaFy < 1e-4 && deltaM < 1e-4;

  // 8. Generate High-Resolution Diagram Points (500+ points)
  const numSamplePoints = 600;
  const sampleXSet = new Set<number>();

  for (let i = 0; i <= numSamplePoints; i++) {
    sampleXSet.add((i / numSamplePoints) * beam.length);
  }

  // Include points right before and after each discontinuity
  distinctCoords.forEach(cx => {
    sampleXSet.add(cx);
    if (cx - 1e-5 >= 0) sampleXSet.add(cx - 1e-5);
    if (cx + 1e-5 <= beam.length) sampleXSet.add(cx + 1e-5);
  });

  const sortedSampleX = Array.from(sampleXSet).sort((a, b) => a - b);
  const diagramPoints: DiagramPoint[] = [];

  let maxShear = -Infinity;
  let minShear = Infinity;
  let maxAbsShearVal = 0;
  let maxAbsShearX = 0;

  let maxMoment = -Infinity;
  let minMoment = Infinity;
  let maxAbsMomentVal = 0;
  let maxAbsMomentX = 0;

  let maxDeflection = -Infinity;
  let minDeflection = Infinity;
  let maxAbsDeflectionVal = 0;
  let maxAbsDeflectionX = 0;

  for (let s = 0; s < sortedSampleX.length; s++) {
    const x = sortedSampleX[s];

    // Method of sections from left (0) to x
    let V = 0;
    let M = 0;

    // Reactions strictly <= x
    reactions.forEach(r => {
      if (r.x <= x + 1e-7) {
        V += r.Fy;
        M += r.Fy * (x - r.x);
        M -= r.M; // Counter-clockwise reaction moment produces hogging (negative) bending moment
      }
    });

    // Applied loads <= x
    loads.forEach(l => {
      if (l.type === 'point' && l.x <= x + 1e-7) {
        V -= l.magnitude; // Downward point load reduces shear
        M -= l.magnitude * (x - l.x);
      } else if (l.type === 'moment' && l.x <= x + 1e-7) {
        // A CW concentrated moment creates a positive jump in bending moment
        const sign = l.momentDirection === 'cw' ? 1 : -1;
        M += l.magnitude * sign;
      } else if (l.type === 'udl' || l.type === 'triangular') {
        const lStart = l.x;
        const lEnd = l.xEnd ?? beam.length;
        if (lStart <= x) {
          const activeLen = Math.min(x, lEnd) - lStart;
          if (activeLen > 0) {
            if (l.type === 'udl') {
              const w = l.magnitude;
              const f = w * activeLen;
              const arm = x - (lStart + activeLen / 2);
              V -= f;
              M -= f * arm;
            } else {
              const w1 = l.magnitude;
              const w2 = l.magnitudeEnd ?? 0;
              const totalSpan = Math.max(1e-6, lEnd - lStart);
              const wAtCut = w1 + (w2 - w1) * (activeLen / totalSpan);
              const f = ((w1 + wAtCut) / 2) * activeLen;
              const centroidFromStart = (activeLen * (w1 + 2 * wAtCut)) / (3 * (w1 + wAtCut || 1));
              const arm = x - (lStart + centroidFromStart);
              V -= f;
              M -= f * arm;
            }
          }
        }
      }
    });

    // Clean up near zero (floating-point epsilon noise)
    if (Math.abs(V) < 1e-12) V = 0;
    if (Math.abs(M) < 1e-12) M = 0;

    // Deflection & Slope from element shape functions + particular solution
    let vDisp = 0;
    let slope = 0;

    // Find element containing x
    for (let e = 0; e < numElements; e++) {
      const n1 = nodes[e];
      const n2 = nodes[e + 1];
      if (x >= n1.x - 1e-7 && (x <= n2.x + 1e-7 || e === numElements - 1)) {
        const Le = n2.x - n1.x;
        if (Le > 1e-7) {
          const xi = Math.max(0, Math.min(1, (x - n1.x) / Le));
          const v1 = D[n1.vDof];
          const t1 = n1.isHinge ? D[n1.thetaRightDof!] : D[n1.thetaDof!];
          const v2 = D[n2.vDof];
          const t2 = n2.isHinge ? D[n2.thetaLeftDof!] : D[n2.thetaDof!];

          // Hermite cubic shape functions
          const xi2 = xi * xi;
          const xi3 = xi2 * xi;
          const xi4 = xi3 * xi;
          const N1 = 1 - 3 * xi2 + 2 * xi3;
          const N2 = Le * (xi - 2 * xi2 + xi3);
          const N3 = 3 * xi2 - 2 * xi3;
          const N4 = Le * (xi3 - xi2);

          const dN1 = (-6 * xi + 6 * xi2) / Le;
          const dN2 = 1 - 4 * xi + 3 * xi2;
          const dN3 = (6 * xi - 6 * xi2) / Le;
          const dN4 = 3 * xi2 - 2 * xi;

          vDisp = N1 * v1 + N2 * t1 + N3 * v2 + N4 * t2;
          slope = dN1 * v1 + dN2 * t1 + dN3 * v2 + dN4 * t2;

          // Add fixed-fixed particular solution for distributed loads on this element
          loads.forEach(load => {
            if (load.type === 'udl' || load.type === 'triangular') {
              const lStart = load.x;
              const lEnd = load.xEnd ?? beam.length;
              if (Math.max(n1.x, lStart) < Math.min(n2.x, lEnd) - 1e-6) {
                const totalSpan = Math.max(1e-6, lEnd - lStart);
                const wStart = load.magnitude;
                const wEnd = load.type === 'triangular' ? (load.magnitudeEnd ?? 0) : load.magnitude;

                const w1Elem = wStart + (wEnd - wStart) * ((n1.x - lStart) / totalSpan);
                const w2Elem = wStart + (wEnd - wStart) * ((n2.x - lStart) / totalSpan);
                const wu = w1Elem;
                const dw = w2Elem - w1Elem;

                const L4 = Le * Le * Le * Le;
                const L3 = Le * Le * Le;
                const elemEI = elementEIs[e] || calculateEI(200, 100, unitSystem);

                // Fixed-Fixed particular solution:
                // v_p(xi) = - (wu * L4 / (24*EI)) * xi^2 * (1 - xi)^2
                //         - (dw * L4 / (120*EI)) * (2*xi^2 - 3*xi^3 + xi^5)
                const vp_u = - (wu * L4 / (24 * elemEI)) * (xi2 - 2 * xi3 + xi4);
                const dvp_u = - (wu * L3 / (24 * elemEI)) * (2 * xi - 6 * xi2 + 4 * xi3);

                const vp_dw = - (dw * L4 / (120 * elemEI)) * (2 * xi2 - 3 * xi3 + xi4 * xi);
                const dvp_dw = - (dw * L3 / (120 * elemEI)) * (4 * xi - 9 * xi2 + 5 * xi4);

                vDisp += (vp_u + vp_dw);
                slope += (dvp_u + dvp_dw);
              }
            }
          });
        }
        break;
      }
    }

    const deflectionDisplay = formatDeflection(vDisp, unitSystem);
    const secAtX = getBeamSectionAt(segments, x, unitSystem);

    diagramPoints.push({
      x,
      shear: V,
      moment: M,
      deflection: deflectionDisplay,
      slope,
      E: secAtX.E,
      I: secAtX.I
    });

    if (V > maxShear) maxShear = V;
    if (V < minShear) minShear = V;
    if (Math.abs(V) > maxAbsShearVal) {
      maxAbsShearVal = Math.abs(V);
      maxAbsShearX = x;
    }

    if (M > maxMoment) maxMoment = M;
    if (M < minMoment) minMoment = M;
    if (Math.abs(M) > maxAbsMomentVal) {
      maxAbsMomentVal = Math.abs(M);
      maxAbsMomentX = x;
    }

    if (deflectionDisplay > maxDeflection) maxDeflection = deflectionDisplay;
    if (deflectionDisplay < minDeflection) minDeflection = deflectionDisplay;
    if (Math.abs(deflectionDisplay) > maxAbsDeflectionVal) {
      maxAbsDeflectionVal = Math.abs(deflectionDisplay);
      maxAbsDeflectionX = x;
    }
  }

  // 9. Critical Points Identification
  const criticalPoints: CriticalPoint[] = [];

  validSupports.forEach(s => {
    criticalPoints.push({
      x: s.x,
      type: 'support',
      label: s.type.toUpperCase()
    });
  });

  // Zero-Shear points (crossings where V crosses 0)
  for (let i = 0; i < diagramPoints.length - 1; i++) {
    const p1 = diagramPoints[i];
    const p2 = diagramPoints[i + 1];
    if ((p1.shear > 0 && p2.shear < 0) || (p1.shear < 0 && p2.shear > 0)) {
      // Linear interpolation to find root
      const ratio = Math.abs(p1.shear) / (Math.abs(p1.shear) + Math.abs(p2.shear) || 1);
      const rootX = p1.x + ratio * (p2.x - p1.x);
      criticalPoints.push({
        x: rootX,
        type: 'zero_shear',
        label: 'V = 0 (Local Max M)'
      });
    }
  }

  // 10. Generate Educational Calculation Steps
  const { calculationSteps, piecewiseEquations } = generateCalculationSteps(
    beam,
    validSupports,
    loads,
    reactions,
    unitSystem,
    isDeterminate,
    degIndet,
    true
  );

  return {
    isStable: true,
    isDeterminate,
    degreeOfIndeterminacy: degIndet,
    reactions,
    diagramPoints,
    maxShear: { value: maxShear, x: maxAbsShearX },
    minShear: { value: minShear, x: maxAbsShearX },
    maxAbsShear: { value: maxAbsShearVal, x: maxAbsShearX },
    maxMoment: { value: maxMoment, x: maxAbsMomentX },
    minMoment: { value: minMoment, x: maxAbsMomentX },
    maxAbsMoment: { value: maxAbsMomentVal, x: maxAbsMomentX },
    maxDeflection: { value: maxDeflection, x: maxAbsDeflectionX },
    minDeflection: { value: minDeflection, x: maxAbsDeflectionX },
    maxAbsDeflection: { value: maxAbsDeflectionVal, x: maxAbsDeflectionX },
    equilibriumCheck: {
      sumFy: deltaFy,
      sumM: deltaM,
      isBalanced
    },
    criticalPoints,
    piecewiseEquations,
    calculationSteps
  };
}
