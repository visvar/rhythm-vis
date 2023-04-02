/**
 * Pitches that are mapped onto themselves are included for other information.
 * Notation info (line and shape of symbol) so drum notation can generate a lookup from this
 * https://en.wikipedia.org/wiki/Percussion_notation#/media/File:Sibelius_drum_legend.png
 * Lines start with 0 at the top above the top most horizontal notation line,
 * using incremental integers for every possible position, i.e. for on and between lines
 *
 * Legend:
 *  Map key: The orignal pitch from the input data
 *  repPitch: Replacement pitch, used to simplify multiple zones into one
 *  zone: Zone of the instrument this pitch comes from
 *  order: visual order ranking of this intrument in the UI (top-bottom or left-right)
 *  line: y position in the drum notation (using integers for every possible position)
 *  shape: Note shape in notation: triangle, <>, x, o, ostroke, xstroke
 *  label: Short label for this intrument
 *  name: Full name of this instrument
 *
 * @type {Map<number,object>}
 */
export const drumPitchReplacementMap = new Map([
  // Crash 1
  [49, { repPitch: 49, zone: 1, order: 10, line: -1, shape: 'o', label: 'CC1', name: 'Crash Cymbal 1', type: 'cymbal' }],
  [55, { repPitch: 49, zone: 2, order: 11, line: -1, shape: 'o', label: 'CC1', name: 'Crash Cymbal 1', type: 'cymbal' }],
  // Crash 2
  [52, { repPitch: 57, zone: 1, order: 20, line: 0, shape: 'o', label: 'CC2', name: 'Crash Cymbal 2', type: 'cymbal' }],
  [57, { repPitch: 57, zone: 2, order: 21, line: 0, shape: 'o', label: 'CC2', name: 'Crash Cymbal 2', type: 'cymbal' }],
  // Hi-hat stick
  [22, { repPitch: 46, zone: 1, order: 30, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat', type: 'hi-hat' }],
  [26, { repPitch: 46, zone: 2, order: 31, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat', type: 'hi-hat' }],
  [42, { repPitch: 46, zone: 3, order: 32, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat', type: 'hi-hat' }],
  [46, { repPitch: 46, zone: 4, order: 33, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat', type: 'hi-hat' }],
  // Hi-hat pedal
  [44, { repPitch: 44, zone: 1, order: 40, line: 9, shape: 'o', label: 'HHP', name: 'Hi-Hat Pedal', type: 'hi-hat' }],
  // Ride
  [51, { repPitch: 51, zone: 1, order: 50, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal', type: 'cymbal' }],
  [53, { repPitch: 51, zone: 2, order: 51, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal', type: 'cymbal' }],
  [59, { repPitch: 51, zone: 3, order: 52, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal', type: 'cymbal' }],
  // Snare
  [38, { repPitch: 38, zone: 1, order: 60, line: 4, shape: 'o', label: 'SN', name: 'Snare', type: 'snare' }],
  [40, { repPitch: 38, zone: 2, order: 61, line: 4, shape: 'o', label: 'SN', name: 'Snare', type: 'snare' }],
  // Tom 1
  [48, { repPitch: 48, zone: 1, order: 90, line: 2, shape: 'o', label: 'T1', name: 'Tom 1', type: 'tom' }],
  [50, { repPitch: 48, zone: 2, order: 91, line: 2, shape: 'o', label: 'T1', name: 'Tom 1', type: 'tom' }],
  // Tom 2
  [45, { repPitch: 45, zone: 1, order: 100, line: 3, shape: 'o', label: 'T2', name: 'Tom 2', type: 'tom' }],
  [47, { repPitch: 45, zone: 2, order: 101, line: 3, shape: 'o', label: 'T2', name: 'Tom 2', type: 'tom' }],
  // Stand tom 1
  [43, { repPitch: 43, zone: 1, order: 70, line: 5, shape: 'o', label: 'ST1', name: 'Stand Tom 1', type: 'tom' }],
  [58, { repPitch: 43, zone: 2, order: 71, line: 5, shape: 'o', label: 'ST1', name: 'Stand Tom 1', type: 'tom' }],
  // Stand tom 2
  [39, { repPitch: 41, zone: 1, order: 80, line: 6, shape: 'o', label: 'ST2', name: 'Stand Tom 2', type: 'tom' }],
  [41, { repPitch: 41, zone: 2, order: 81, line: 6, shape: 'o', label: 'ST2', name: 'Stand Tom 2', type: 'tom' }],
  // Bass drum
  [35, { repPitch: 36, zone: 1, order: 110, line: 8, shape: 'o', label: 'BD', name: 'Bass Drum', type: 'bass' }],
  [36, { repPitch: 36, zone: 2, order: 111, line: 8, shape: 'o', label: 'BD', name: 'Bass Drum', type: 'bass' }]
])

/**
 * TODO: for ground truth and simulator
 * TODO: add to mvlib
 */
export const drumPitchReplacementMapGuitarPro = new Map([
  // snare
  [38, { repPitch: 38, shape: 'o', label: 'SN', name: 'Snare (hit)', type: 'snare' }],
  [37, { repPitch: 38, shape: 'x', label: 'SN', name: 'Snare (side stick)', type: 'snare' }],
  [91, { repPitch: 38, shape: '<>', label: 'SN', name: 'Snare (rim shot)', type: 'snare' }],
  // hit-hat
  [42, { repPitch: 42, shape: 'x', label: 'HHS', name: 'Hi-Hat (closed)', type: 'hi-hat' }],
  [92, { repPitch: 42, shape: '(/)', label: 'HHS', name: 'Hi-Hat (half)', type: 'hi-hat' }],
  [46, { repPitch: 42, shape: '(x)', label: 'HHS', name: 'Hi-Hat (open)', type: 'hi-hat' }],
  [44, { repPitch: 44, shape: 'x', label: 'HHP', name: 'Hi-Hat (pedal)', type: 'hi-hat' }],
  // kick
  [35, { repPitch: 36, shape: 'o', label: 'BD', name: 'Kick (hit)', type: 'bass' }],
  [36, { repPitch: 36, shape: 'o', label: 'BD', name: 'Kick (hit)', type: 'bass' }],
  // toms
  [50, { repPitch: 50, shape: 'o', label: 'T1', name: 'High Floor Tom', type: 'tom' }],
  [48, { repPitch: 48, shape: 'o', label: 'T2', name: 'High Tom', type: 'tom' }],
  [47, { repPitch: 47, shape: 'o', label: 'T3', name: 'Mid Tom', type: 'tom' }],
  [45, { repPitch: 45, shape: 'o', label: 'T4', name: 'Low Tom', type: 'tom' }],
  [43, { repPitch: 43, shape: 'o', label: 'T5', name: 'Very Low Tom', type: 'tom' }],
  // cymbals
  [93, { repPitch: 51, shape: 'x_/', label: 'Rd', name: 'Ride (edge)', type: 'cymbal' }],
  [51, { repPitch: 51, shape: 'x', label: 'Rd', name: 'Ride (middle)', type: 'cymbal' }],
  [53, { repPitch: 51, shape: '<>', label: 'Rd', name: 'Ride (bell)', type: 'cymbal' }],
  [55, { repPitch: 55, shape: 'x-', label: 'Sp', name: 'Splash (hit)', type: 'cymbal' }],
  [52, { repPitch: 52, shape: 'x^', label: 'Ch', name: 'China (hit)', type: 'cymbal' }],
  [49, { repPitch: 49, shape: 'x-', label: 'Cr', name: 'Crash high', type: 'cymbal' }],
  [57, { repPitch: 49, shape: 'x', label: 'Cr', name: 'Crash medium', type: 'cymbal' }],
  [99, { repPitch: 99, shape: '^', label: 'Cb', name: 'Cowbell low', type: 'cymbal' }],
  [56, { repPitch: 99, shape: '^', label: 'Cb', name: 'Cowbell medium', type: 'cymbal' }],
  [102, { repPitch: 99, shape: '^', label: 'Cb', name: 'Cowbell high', type: 'cymbal' }]
])
