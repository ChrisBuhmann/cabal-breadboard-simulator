import type { PinOffset, Rotation } from '../interaction/rotation';

export type ComponentType =
  | 'resistor'
  | 'capacitor-film'
  | 'capacitor-ceramic'
  | 'capacitor-electrolytic'
  | 'diode'
  | 'led'
  | 'to92'
  | 'dip8'
  | 'dip14'
  | 'pot';

export type PackageKind = 'axial' | 'radial' | 'to92' | 'dip' | 'pot';

export interface ComponentDef {
  type: ComponentType;
  label: string;
  packageKind: PackageKind;
  pinCount: number;
  /** Pin offsets relative to pin 0, at rotation 0. */
  basePins: PinOffset[];
  allowedRotations: Rotation[];
  polarized: boolean;
  defaultValue: string;
  /** True only for packages allowed to straddle the trench (DIP-8/14). */
  straddlesTrench: boolean;
}

export interface PlacedComponent {
  id: string;
  boardId: string;
  type: ComponentType;
  anchorHoleId: string;
  rotation: Rotation;
  value: string;
}

const line = (n: number): PinOffset[] =>
  Array.from({ length: n }, (_, i) => ({ dcol: i, drow: 0 }));

const dipPins = (halfWidth: number): PinOffset[] => [
  ...Array.from({ length: halfWidth }, (_, i) => ({ dcol: i, drow: 0 })),
  ...Array.from({ length: halfWidth }, (_, i) => ({ dcol: i, drow: 1 })),
];

export const COMPONENT_DEFS: Record<ComponentType, ComponentDef> = {
  resistor: {
    type: 'resistor',
    label: 'Resistor',
    packageKind: 'axial',
    pinCount: 2,
    basePins: [{ dcol: 0, drow: 0 }, { dcol: 4, drow: 0 }],
    allowedRotations: [0, 90, 180, 270],
    polarized: false,
    defaultValue: '220',
    straddlesTrench: false,
  },
  'capacitor-film': {
    type: 'capacitor-film',
    label: 'Film Capacitor',
    packageKind: 'radial',
    pinCount: 2,
    basePins: line(2),
    allowedRotations: [0, 90, 180, 270],
    polarized: false,
    defaultValue: '100nF',
    straddlesTrench: false,
  },
  'capacitor-ceramic': {
    type: 'capacitor-ceramic',
    label: 'Ceramic Capacitor',
    packageKind: 'radial',
    pinCount: 2,
    basePins: line(2),
    allowedRotations: [0, 90, 180, 270],
    polarized: false,
    defaultValue: '100nF',
    straddlesTrench: false,
  },
  'capacitor-electrolytic': {
    type: 'capacitor-electrolytic',
    label: 'Electrolytic Capacitor',
    packageKind: 'radial',
    pinCount: 2,
    basePins: line(2),
    allowedRotations: [0, 90, 180, 270],
    polarized: true,
    defaultValue: '10uF',
    straddlesTrench: false,
  },
  diode: {
    type: 'diode',
    label: 'Diode',
    packageKind: 'axial',
    pinCount: 2,
    basePins: [{ dcol: 0, drow: 0 }, { dcol: 3, drow: 0 }],
    allowedRotations: [0, 90, 180, 270],
    polarized: true,
    defaultValue: '1N4148',
    straddlesTrench: false,
  },
  led: {
    type: 'led',
    label: 'LED',
    packageKind: 'radial',
    pinCount: 2,
    basePins: line(2),
    allowedRotations: [0, 90, 180, 270],
    polarized: true,
    defaultValue: 'red',
    straddlesTrench: false,
  },
  to92: {
    type: 'to92',
    label: 'TO-92 (Transistor/JFET)',
    packageKind: 'to92',
    pinCount: 3,
    basePins: line(3),
    allowedRotations: [0, 90, 180, 270],
    polarized: false,
    defaultValue: '2N3904',
    straddlesTrench: false,
  },
  dip8: {
    type: 'dip8',
    label: 'DIP-8 IC',
    packageKind: 'dip',
    pinCount: 8,
    basePins: dipPins(4),
    allowedRotations: [0, 180],
    polarized: false,
    defaultValue: 'DIP-8',
    straddlesTrench: true,
  },
  dip14: {
    type: 'dip14',
    label: 'DIP-14 IC',
    packageKind: 'dip',
    pinCount: 14,
    basePins: dipPins(7),
    allowedRotations: [0, 180],
    polarized: false,
    defaultValue: 'DIP-14',
    straddlesTrench: true,
  },
  pot: {
    type: 'pot',
    label: 'Potentiometer',
    packageKind: 'pot',
    pinCount: 3,
    basePins: line(3),
    allowedRotations: [0, 90, 180, 270],
    polarized: false,
    defaultValue: '10k',
    straddlesTrench: false,
  },
};

export const COMPONENT_TYPES: ComponentType[] = Object.keys(COMPONENT_DEFS) as ComponentType[];
