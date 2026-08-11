import type { ComponentType } from '../components/componentDefs';

export interface KicadPin {
  /** Local symbol-space coordinates (mm), Y-up, as defined in the KiCad library. */
  x: number;
  y: number;
  /** KiCad pin number this app's pin_index maps to. Usually 1-based, but some
   * connector symbols (e.g. AudioJack2) use letter designators like "T"/"S". */
  number: number | string;
}

export interface KicadPartMapping {
  /** Symbol name key into KICAD_DEVICE_SYMBOLS, or a custom generic symbol name. */
  symbolName: string;
  libId: string;
  footprint: string;
  refPrefix: string;
  /** Indexed by this app's pin_index (matches PlacedComponent/basePins order). */
  pins: KicadPin[];
}

const dipPins = (halfWidth: number): KicadPin[] => {
  const pitch = 2.54;
  const xs = Array.from({ length: halfWidth }, (_, i) => (i - (halfWidth - 1) / 2) * pitch);
  return [
    ...xs.map((x, i): KicadPin => ({ x, y: 6.35, number: i + 1 })),
    ...xs.map((x, i): KicadPin => ({ x, y: -6.35, number: halfWidth + i + 1 })),
  ];
};

/** Component -> KiCad symbol/footprint/pin mapping, verified against the real
 * KiCad 7 Device.kicad_sym library (see kicadSymbols.ts). Diode/LED pin order is
 * inverted (anode/cathode swapped) relative to a simple index+1 mapping because
 * this app's pin 0 = anode (see componentRender/diode.tsx, led.tsx) while KiCad's
 * D/LED symbols number pin 1 = cathode. TO-92 assumes the app's default physical
 * E-B-C left-to-right layout (matching the default "2N3904" value); swap the
 * generated symbol if the real part has a different pinout (PNP, JFET, etc). */
export const KICAD_MAPPING: Record<ComponentType, KicadPartMapping> = {
  resistor: {
    symbolName: 'R',
    libId: 'Device:R',
    footprint: 'Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal',
    refPrefix: 'R',
    pins: [
      { x: 0, y: 3.81, number: 1 },
      { x: 0, y: -3.81, number: 2 },
    ],
  },
  'capacitor-film': {
    symbolName: 'C',
    libId: 'Device:C',
    footprint: 'Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm',
    refPrefix: 'C',
    pins: [
      { x: 0, y: 3.81, number: 1 },
      { x: 0, y: -3.81, number: 2 },
    ],
  },
  'capacitor-ceramic': {
    symbolName: 'C',
    libId: 'Device:C',
    footprint: 'Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm',
    refPrefix: 'C',
    pins: [
      { x: 0, y: 3.81, number: 1 },
      { x: 0, y: -3.81, number: 2 },
    ],
  },
  'capacitor-electrolytic': {
    symbolName: 'C_Polarized',
    libId: 'Device:C_Polarized',
    footprint: 'Capacitor_THT:CP_Radial_D5.0mm_P2.00mm',
    refPrefix: 'C',
    pins: [
      { x: 0, y: 3.81, number: 1 }, // pin 0 = "+" (app) = pin 1 = "+" (KiCad)
      { x: 0, y: -3.81, number: 2 },
    ],
  },
  diode: {
    symbolName: 'D',
    libId: 'Device:D',
    footprint: 'Diode_THT:D_DO-35_SOD27_P10.16mm_Horizontal',
    refPrefix: 'D',
    pins: [
      { x: 3.81, y: 0, number: 2 }, // pin 0 = anode (app) = pin 2 = A (KiCad)
      { x: -3.81, y: 0, number: 1 }, // pin 1 = cathode (app) = pin 1 = K (KiCad)
    ],
  },
  led: {
    symbolName: 'LED',
    libId: 'Device:LED',
    footprint: 'LED_THT:LED_D5.0mm',
    refPrefix: 'D',
    pins: [
      { x: 3.81, y: 0, number: 2 }, // pin 0 = anode (app) = pin 2 = A (KiCad)
      { x: -3.81, y: 0, number: 1 }, // pin 1 = cathode (app) = pin 1 = K (KiCad)
    ],
  },
  to92: {
    symbolName: 'Q_NPN_EBC',
    libId: 'Device:Q_NPN_EBC',
    footprint: 'Package_TO_SOT_THT:TO-92_Inline',
    refPrefix: 'Q',
    pins: [
      { x: 2.54, y: -5.08, number: 1 }, // E
      { x: -5.08, y: 0, number: 2 }, // B
      { x: 2.54, y: 5.08, number: 3 }, // C
    ],
  },
  dip8: {
    symbolName: 'CabalGeneric_DIP8',
    libId: 'CabalGeneric:CabalGeneric_DIP8',
    footprint: 'Package_DIP:DIP-8_W7.62mm_Socket',
    refPrefix: 'U',
    pins: dipPins(4),
  },
  dip14: {
    symbolName: 'CabalGeneric_DIP14',
    libId: 'CabalGeneric:CabalGeneric_DIP14',
    footprint: 'Package_DIP:DIP-14_W7.62mm_Socket',
    refPrefix: 'U',
    pins: dipPins(7),
  },
  dip16: {
    symbolName: 'CabalGeneric_DIP16',
    libId: 'CabalGeneric:CabalGeneric_DIP16',
    footprint: 'Package_DIP:DIP-16_W7.62mm_Socket',
    refPrefix: 'U',
    pins: dipPins(8),
  },
  pot: {
    symbolName: 'R_Potentiometer',
    libId: 'Device:R_Potentiometer',
    footprint: '',
    refPrefix: 'RV',
    pins: [
      { x: 0, y: 3.81, number: 1 },
      { x: 3.81, y: 0, number: 2 }, // wiper
      { x: 0, y: -3.81, number: 3 },
    ],
  },
  'input-jack': {
    symbolName: 'AudioJack2',
    libId: 'Connector_Audio:AudioJack2',
    // Neutrik NJ2FD-V: standard 6.35mm (1/4") non-switching mono (TS) jack,
    // the usual choice for a guitar pedal's in/out.
    footprint: 'Connector_Audio:Jack_6.35mm_Neutrik_NJ2FD-V_Vertical',
    refPrefix: 'J',
    pins: [
      { x: 5.08, y: 0, number: 'T' }, // pin 0 = tip (signal) (app) = pin T (KiCad)
      { x: 5.08, y: 2.54, number: 'S' }, // pin 1 = sleeve (ground) (app) = pin S (KiCad)
    ],
  },
  'output-jack': {
    symbolName: 'AudioJack2',
    libId: 'Connector_Audio:AudioJack2',
    footprint: 'Connector_Audio:Jack_6.35mm_Neutrik_NJ2FD-V_Vertical',
    refPrefix: 'J',
    pins: [
      { x: 5.08, y: 0, number: 'T' },
      { x: 5.08, y: 2.54, number: 'S' },
    ],
  },
};
