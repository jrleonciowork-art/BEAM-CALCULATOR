import { PresetBeam } from '../types/beam';

export const PRESET_BEAMS: PresetBeam[] = [
  {
    id: 'simply-supported-point',
    name: 'Simply Supported — Midspan Load',
    description: 'Pin at x=0, Roller at x=6m with a central 50 kN point load at x=3m.',
    beam: {
      length: 6,
      E: 200,
      I: 100,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 6, E: 200, I: 100, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'pin', x: 0 },
      { id: 's2', type: 'roller', x: 6 }
    ],
    loads: [
      { id: 'l1', type: 'point', x: 3, magnitude: 50 }
    ]
  },
  {
    id: 'stepped-beam-two-span',
    name: '⚡ Stepped Beam (2I / I Cross-Section)',
    description: 'Pin at x=0, Roller at x=8m with 2x stiffness (I=200) on first half and I=100 on second half under a 50 kN load.',
    beam: {
      length: 8,
      E: 200,
      I: 150,
      segments: [
        { id: 'seg_1', xStart: 0, xEnd: 4, E: 200, I: 200, isTapered: false },
        { id: 'seg_2', xStart: 4, xEnd: 8, E: 200, I: 100, isTapered: false }
      ]
    },
    supports: [
      { id: 's1', type: 'pin', x: 0 },
      { id: 's2', type: 'roller', x: 8 }
    ],
    loads: [
      { id: 'l1', type: 'point', x: 4, magnitude: 50 }
    ]
  },
  {
    id: 'tapered-haunched-cantilever',
    name: '⚡ Tapered / Haunched Cantilever',
    description: 'Fixed at x=0, free at x=6m. Linearly tapering profile from I=250 at fixed root down to I=50 at free tip.',
    beam: {
      length: 6,
      E: 200,
      I: 150,
      segments: [
        { id: 'seg_1', xStart: 0, xEnd: 6, E: 200, I: 250, isTapered: true, IEnd: 50 }
      ]
    },
    supports: [
      { id: 's1', type: 'fixed', x: 0 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 6, magnitude: 15 },
      { id: 'l2', type: 'point', x: 6, magnitude: 25 }
    ]
  },
  {
    id: 'simply-supported-udl',
    name: 'Simply Supported — Uniform Load (UDL)',
    description: 'Pin at x=0, Roller at x=8m with 20 kN/m uniform load across the full span.',
    beam: {
      length: 8,
      E: 200,
      I: 120,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 8, E: 200, I: 120, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'pin', x: 0 },
      { id: 's2', type: 'roller', x: 8 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 8, magnitude: 20 }
    ]
  },
  {
    id: 'cantilever-point-udl',
    name: 'Cantilever — End Load & Partial UDL',
    description: 'Fixed support at x=0 with 15 kN/m UDL and 30 kN downward point load at the free tip.',
    beam: {
      length: 4,
      E: 200,
      I: 80,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 4, E: 200, I: 80, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'fixed', x: 0 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 4, magnitude: 15 },
      { id: 'l2', type: 'point', x: 4, magnitude: 30 }
    ]
  },
  {
    id: 'overhanging-triangular',
    name: 'Overhanging Beam — Triangular Load',
    description: 'Overhanging supports at x=2m and x=8m with triangular distributed load and overhang tip load.',
    beam: {
      length: 10,
      E: 200,
      I: 150,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 10, E: 200, I: 150, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'pin', x: 2 },
      { id: 's2', type: 'roller', x: 8 }
    ],
    loads: [
      { id: 'l1', type: 'triangular', x: 2, xEnd: 8, magnitude: 0, magnitudeEnd: 24 },
      { id: 'l2', type: 'point', x: 10, magnitude: 20 }
    ]
  },
  {
    id: 'propped-cantilever',
    name: 'Propped Cantilever (Indeterminate Degree 1)',
    description: 'Fixed at x=0 and roller prop at x=6m subjected to 16 kN/m uniform distributed load.',
    beam: {
      length: 6,
      E: 200,
      I: 100,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 6, E: 200, I: 100, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'fixed', x: 0 },
      { id: 's2', type: 'roller', x: 6 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 6, magnitude: 16 }
    ]
  },
  {
    id: 'fixed-fixed-point',
    name: 'Fixed-Fixed Beam (Indeterminate Degree 2)',
    description: 'Fully fixed at both ends (x=0 and x=6m) with a central 60 kN point load.',
    beam: {
      length: 6,
      E: 200,
      I: 100,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 6, E: 200, I: 100, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'fixed', x: 0 },
      { id: 's2', type: 'fixed', x: 6 }
    ],
    loads: [
      { id: 'l1', type: 'point', x: 3, magnitude: 60 }
    ]
  },
  {
    id: 'continuous-two-span',
    name: 'Two-Span Continuous Beam (Indeterminate)',
    description: 'Supports at x=0, 6m, and 12m with 12 kN/m uniform load across both spans.',
    beam: {
      length: 12,
      E: 200,
      I: 120,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 12, E: 200, I: 120, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'pin', x: 0 },
      { id: 's2', type: 'roller', x: 6 },
      { id: 's3', type: 'roller', x: 12 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 12, magnitude: 12 }
    ]
  },
  {
    id: 'gerber-internal-hinge',
    name: 'Gerber Beam (Internal Hinge)',
    description: 'Fixed support at x=0, internal hinge at x=4m, and roller support at x=8m.',
    beam: {
      length: 8,
      E: 200,
      I: 100,
      segments: [{ id: 'seg_1', xStart: 0, xEnd: 8, E: 200, I: 100, isTapered: false }]
    },
    supports: [
      { id: 's1', type: 'fixed', x: 0 },
      { id: 's2', type: 'hinge', x: 4 },
      { id: 's3', type: 'roller', x: 8 }
    ],
    loads: [
      { id: 'l1', type: 'udl', x: 0, xEnd: 8, magnitude: 15 }
    ]
  }
];
