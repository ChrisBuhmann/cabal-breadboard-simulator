/**
 * Verbatim `lib_symbols` bodies copied from KiCad's own standard libraries
 * (Device.kicad_sym and Connector_Audio.kicad_sym, v7), keyed by the symbol
 * name used in "<Library>:<name>" lib_ids. Embedding the full graphical
 * definition is how real KiCad schematics stay self-contained, so a
 * generated .kicad_sch never depends on the user's local library install.
 *
 * Naming convention (confirmed against real KiCad 7 eeschema, not guessed):
 * the top-level embedded symbol name must be library-qualified
 * ("Device:R") to match the placed instance's lib_id, or KiCad shows an
 * unresolved "??" placeholder instead of the symbol body. The nested
 * sub-unit symbols underneath it ("R_0_1", "R_1_1") must stay bare --
 * qualifying those too makes KiCad reject the whole file with "Invalid
 * symbol unit name prefix".
 *
 * CabalGeneric_DIP8/DIP14 are hand-authored placeholders (no real 8/14-pin
 * device is known from a breadboard placement alone) with pins on the top and
 * bottom edges, left-to-right, matching this app's own DIP pin ordering
 * (see componentDefs.ts's dipPins) rather than KiCad's usual left/right IC
 * convention, so pin_index -> KiCad pin number needs no remapping.
 */

export const KICAD_DEVICE_SYMBOLS: Record<string, string> = {
  R: `  (symbol "Device:R" (pin_numbers hide) (pin_names (offset 0)) (in_bom yes) (on_board yes)
    (property "Reference" "R" (at 2.032 0 90)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "R" (at 0 0 90)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at -1.778 0 90)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "R_0_1"
      (rectangle (start -1.016 -2.54) (end 1.016 2.54)
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
    )
    (symbol "R_1_1"
      (pin passive line (at 0 3.81 270) (length 1.27)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 0 -3.81 90) (length 1.27)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  C: `  (symbol "Device:C" (pin_numbers hide) (pin_names (offset 0.254)) (in_bom yes) (on_board yes)
    (property "Reference" "C" (at 0.635 2.54 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Value" "C" (at 0.635 -2.54 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Footprint" "" (at 0.9652 -3.81 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "C_0_1"
      (polyline
        (pts
          (xy -2.032 -0.762)
          (xy 2.032 -0.762)
        )
        (stroke (width 0.508) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -2.032 0.762)
          (xy 2.032 0.762)
        )
        (stroke (width 0.508) (type default))
        (fill (type none))
      )
    )
    (symbol "C_1_1"
      (pin passive line (at 0 3.81 270) (length 2.794)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 0 -3.81 90) (length 2.794)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  C_Polarized: `  (symbol "Device:C_Polarized" (pin_numbers hide) (pin_names (offset 0.254)) (in_bom yes) (on_board yes)
    (property "Reference" "C" (at 0.635 2.54 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Value" "C_Polarized" (at 0.635 -2.54 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Footprint" "" (at 0.9652 -3.81 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "C_Polarized_0_1"
      (rectangle (start -2.286 0.508) (end 2.286 1.016)
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -1.778 2.286)
          (xy -0.762 2.286)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -1.27 2.794)
          (xy -1.27 1.778)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (rectangle (start 2.286 -0.508) (end -2.286 -1.016)
        (stroke (width 0) (type default))
        (fill (type outline))
      )
    )
    (symbol "C_Polarized_1_1"
      (pin passive line (at 0 3.81 270) (length 2.794)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 0 -3.81 90) (length 2.794)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  D: `  (symbol "Device:D" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
    (property "Reference" "D" (at 0 2.54 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "D" (at 0 -2.54 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "D_0_1"
      (polyline
        (pts
          (xy -1.27 1.27)
          (xy -1.27 -1.27)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 1.27 0)
          (xy -1.27 0)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 1.27 1.27)
          (xy 1.27 -1.27)
          (xy -1.27 0)
          (xy 1.27 1.27)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
    )
    (symbol "D_1_1"
      (pin passive line (at -3.81 0 0) (length 2.54)
        (name "K" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 3.81 0 180) (length 2.54)
        (name "A" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  LED: `  (symbol "Device:LED" (pin_numbers hide) (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
    (property "Reference" "D" (at 0 2.54 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "LED" (at 0 -2.54 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "LED_0_1"
      (polyline
        (pts
          (xy -1.27 -1.27)
          (xy -1.27 1.27)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -1.27 0)
          (xy 1.27 0)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 1.27 -1.27)
          (xy 1.27 1.27)
          (xy -1.27 0)
          (xy 1.27 -1.27)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -3.048 -0.762)
          (xy -4.572 -2.286)
          (xy -3.81 -2.286)
          (xy -4.572 -2.286)
          (xy -4.572 -1.524)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy -1.778 -0.762)
          (xy -3.302 -2.286)
          (xy -2.54 -2.286)
          (xy -3.302 -2.286)
          (xy -3.302 -1.524)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
    )
    (symbol "LED_1_1"
      (pin passive line (at -3.81 0 0) (length 2.54)
        (name "K" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 3.81 0 180) (length 2.54)
        (name "A" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  Q_NPN_EBC: `  (symbol "Device:Q_NPN_EBC" (pin_names (offset 0) hide) (in_bom yes) (on_board yes)
    (property "Reference" "Q" (at 5.08 1.27 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Value" "Q_NPN_EBC" (at 5.08 -1.27 0)
      (effects (font (size 1.27 1.27)) (justify left))
    )
    (property "Footprint" "" (at 5.08 2.54 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "Q_NPN_EBC_0_1"
      (polyline
        (pts
          (xy 0.635 0.635)
          (xy 2.54 2.54)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 0.635 -0.635)
          (xy 2.54 -2.54)
          (xy 2.54 -2.54)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 0.635 1.905)
          (xy 0.635 -1.905)
          (xy 0.635 -1.905)
        )
        (stroke (width 0.508) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 1.27 -1.778)
          (xy 1.778 -1.27)
          (xy 2.286 -2.286)
          (xy 1.27 -1.778)
          (xy 1.27 -1.778)
        )
        (stroke (width 0) (type default))
        (fill (type outline))
      )
      (circle (center 1.27 0) (radius 2.8194)
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
    )
    (symbol "Q_NPN_EBC_1_1"
      (pin passive line (at 2.54 -5.08 90) (length 2.54)
        (name "E" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at -5.08 0 0) (length 5.715)
        (name "B" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 2.54 5.08 270) (length 2.54)
        (name "C" (effects (font (size 1.27 1.27))))
        (number "3" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  R_Potentiometer: `  (symbol "Device:R_Potentiometer" (pin_names (offset 1.016) hide) (in_bom yes) (on_board yes)
    (property "Reference" "RV" (at -4.445 0 90)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "R_Potentiometer" (at -2.54 0 90)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "R_Potentiometer_0_1"
      (polyline
        (pts
          (xy 2.54 0)
          (xy 1.524 0)
        )
        (stroke (width 0) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 1.143 0)
          (xy 2.286 0.508)
          (xy 2.286 -0.508)
          (xy 1.143 0)
        )
        (stroke (width 0) (type default))
        (fill (type outline))
      )
      (rectangle (start 1.016 2.54) (end -1.016 -2.54)
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
    )
    (symbol "R_Potentiometer_1_1"
      (pin passive line (at 0 3.81 270) (length 1.27)
        (name "1" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 3.81 0 180) (length 1.27)
        (name "2" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 0 -3.81 90) (length 1.27)
        (name "3" (effects (font (size 1.27 1.27))))
        (number "3" (effects (font (size 1.27 1.27))))
      )
    )
  )`,

  AudioJack2: `  (symbol "Connector_Audio:AudioJack2" (in_bom yes) (on_board yes)
    (property "Reference" "J" (at 0 8.89 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "AudioJack2" (at 0 6.35 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "AudioJack2_0_1"
      (rectangle (start -3.81 0) (end -2.54 -2.54)
        (stroke (width 0.254) (type default))
        (fill (type outline))
      )
      (rectangle (start -2.54 3.81) (end 2.54 -2.54)
        (stroke (width 0.254) (type default))
        (fill (type background))
      )
      (polyline
        (pts
          (xy 0 0)
          (xy 0.635 -0.635)
          (xy 1.27 0)
          (xy 2.54 0)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
      (polyline
        (pts
          (xy 2.54 2.54)
          (xy -0.635 2.54)
          (xy -0.635 0)
          (xy -1.27 -0.635)
          (xy -1.905 0)
        )
        (stroke (width 0.254) (type default))
        (fill (type none))
      )
    )
    (symbol "AudioJack2_1_1"
      (pin passive line (at 5.08 2.54 180) (length 2.54)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "S" (effects (font (size 1.27 1.27))))
      )
      (pin passive line (at 5.08 0 180) (length 2.54)
        (name "~" (effects (font (size 1.27 1.27))))
        (number "T" (effects (font (size 1.27 1.27))))
      )
    )
  )`,
};

function dipPinBlock(number: number, x: number, y: number, angle: 90 | 270): string {
  return `      (pin passive line (at ${x} ${y} ${angle}) (length 2.54)
        (name "${number}" (effects (font (size 1.27 1.27))))
        (number "${number}" (effects (font (size 1.27 1.27))))
      )`;
}

/** Generic N-pin DIP placeholder: pins on top/bottom edges, left-to-right, matching
 * this app's own top-row-then-bottom-row pin ordering (componentDefs.ts's dipPins).
 *
 * `libId` (e.g. "CabalGeneric:CabalGeneric_DIP8") names the top-level embedded
 * symbol, matching the placed instance's lib_id -- but the nested sub-unit
 * symbols (KiCad's "<name>_<unit>_<style>" convention) must use the bare
 * `name`, not the library-qualified id, or KiCad rejects the file with
 * "Invalid symbol unit name prefix" (confirmed against real KiCad 7 eeschema). */
function genericDipSymbol(libId: string, name: string, halfWidth: number): string {
  const pitch = 2.54;
  const xs = Array.from({ length: halfWidth }, (_, i) => (i - (halfWidth - 1) / 2) * pitch);
  const rectHalfWidth = Math.abs(xs[0]) + pitch / 2;

  const topPins = xs.map((x, i) => dipPinBlock(i + 1, x, 6.35, 270)).join('\n');
  const bottomPins = xs.map((x, i) => dipPinBlock(halfWidth + i + 1, x, -6.35, 90)).join('\n');

  return `  (symbol "${libId}" (pin_numbers hide) (pin_names (offset 0.508)) (in_bom yes) (on_board yes)
    (property "Reference" "U" (at 0 8.89 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "${name}" (at 0 -8.89 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "ki_description" "Generic placeholder - pins numbered top row left-to-right then bottom row left-to-right, matching breadboard layout, not real silkscreen order. Swap for the real part's symbol once known." (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "${name}_0_1"
      (rectangle (start -${rectHalfWidth} 3.81) (end ${rectHalfWidth} -3.81)
        (stroke (width 0.254) (type default))
        (fill (type background))
      )
    )
    (symbol "${name}_1_1"
${topPins}
${bottomPins}
    )
  )`;
}

export const KICAD_GENERIC_DIP8 = genericDipSymbol('CabalGeneric:CabalGeneric_DIP8', 'CabalGeneric_DIP8', 4);
export const KICAD_GENERIC_DIP14 = genericDipSymbol('CabalGeneric:CabalGeneric_DIP14', 'CabalGeneric_DIP14', 7);
export const KICAD_GENERIC_DIP16 = genericDipSymbol('CabalGeneric:CabalGeneric_DIP16', 'CabalGeneric_DIP16', 8);

/** Generic 9-pin placeholder for a 3PDT footswitch: a real 3PDT has 9 lugs in a
 * 3x3 grid on a pitch that doesn't match a breadboard/0.1in grid at all, so
 * this places all 9 pins in a single top row, left-to-right, matching this
 * app's own breadboard hole order (componentDefs.ts's line(9)) -- not a real
 * footswitch footprint or lug layout. Swap for the real part once chosen. */
function genericSwitchSymbol(libId: string, name: string, pinCount: number): string {
  const pitch = 2.54;
  const xs = Array.from({ length: pinCount }, (_, i) => (i - (pinCount - 1) / 2) * pitch);
  const rectHalfWidth = Math.abs(xs[0]) + pitch / 2;

  const topPins = xs.map((x, i) => dipPinBlock(i + 1, x, 6.35, 270)).join('\n');

  return `  (symbol "${libId}" (pin_numbers hide) (pin_names (offset 0.508)) (in_bom yes) (on_board yes)
    (property "Reference" "SW" (at 0 8.89 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Value" "${name}" (at 0 -8.89 0)
      (effects (font (size 1.27 1.27)))
    )
    (property "Footprint" "" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "Datasheet" "~" (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (property "ki_description" "Generic 3PDT placeholder - 9 pins numbered left-to-right in a single row, matching breadboard layout, NOT a real 3PDT's 3x3 lug grid or silkscreen order. Swap for the real switch's footprint once chosen." (at 0 0 0)
      (effects (font (size 1.27 1.27)) hide)
    )
    (symbol "${name}_0_1"
      (rectangle (start -${rectHalfWidth} 3.81) (end ${rectHalfWidth} -3.81)
        (stroke (width 0.254) (type default))
        (fill (type background))
      )
    )
    (symbol "${name}_1_1"
${topPins}
    )
  )`;
}

export const KICAD_GENERIC_SW3PDT = genericSwitchSymbol('CabalGeneric:CabalGeneric_SW3PDT', 'CabalGeneric_SW3PDT', 9);
