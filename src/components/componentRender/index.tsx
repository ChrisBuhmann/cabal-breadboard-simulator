import type { ComponentType } from '../componentDefs';
import { ResistorSVG } from './resistor';
import { CeramicCapacitorSVG, ElectrolyticCapacitorSVG, FilmCapacitorSVG } from './capacitor';
import { DiodeSVG } from './diode';
import { LedSVG } from './led';
import { To92SVG } from './to92';
import { Dip8SVG, Dip14SVG } from './dip';
import { PotSVG } from './pot';

export type ComponentVisual = (props: { value: string }) => React.ReactElement;

export const COMPONENT_RENDERERS: Record<ComponentType, ComponentVisual> = {
  resistor: ResistorSVG,
  'capacitor-film': FilmCapacitorSVG,
  'capacitor-ceramic': CeramicCapacitorSVG,
  'capacitor-electrolytic': ElectrolyticCapacitorSVG,
  diode: DiodeSVG,
  led: LedSVG,
  to92: To92SVG,
  dip8: Dip8SVG,
  dip14: Dip14SVG,
  pot: PotSVG,
};
