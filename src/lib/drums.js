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
 *  order: visual order ranking of this intrumentin the UI (top-bottom or left-right)
 *  line: y position in the drum notation (using integers for every possible position)
 *  shape: Note shape in notation: triangle, <>, x, o, ostroke, xstroke
 *  label: Short label for this intrument
 *  name: Full name of this instrument
 *
 * @type {Map<number,object>}
 */
export const drumPitchReplacementMap = new Map([
  // Crash 1
  [49, { repPitch: 49, zone: 1, order: 10, line: -1, shape: 'o', label: 'CC1', name: 'Crash Cymbal 1' }],
  [55, { repPitch: 49, zone: 2, order: 11, line: -1, shape: 'o', label: 'CC1', name: 'Crash Cymbal 1' }],
  // Crash 2
  [52, { repPitch: 57, zone: 1, order: 20, line: 0, shape: 'o', label: 'CC2', name: 'Crash Cymbal 2' }],
  [57, { repPitch: 57, zone: 2, order: 21, line: 0, shape: 'o', label: 'CC2', name: 'Crash Cymbal 2' }],
  // Hi-hat stick
  [22, { repPitch: 46, zone: 1, order: 30, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat' }],
  [26, { repPitch: 46, zone: 2, order: 31, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat' }],
  [42, { repPitch: 46, zone: 3, order: 32, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat' }],
  [46, { repPitch: 46, zone: 4, order: 33, line: 0, shape: '<>', label: 'HHS', name: 'Hi-Hat' }],
  // Hi-hat pedal
  [44, { repPitch: 44, zone: 1, order: 40, line: 9, shape: 'o', label: 'HHP', name: 'Hi-Hat Pedal' }],
  // Ride
  [51, { repPitch: 51, zone: 1, order: 50, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal' }],
  [53, { repPitch: 51, zone: 2, order: 51, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal' }],
  [59, { repPitch: 51, zone: 3, order: 52, line: 1, shape: 'x', label: 'Rd', name: 'Ride Cymbal' }],
  // Snare
  [38, { repPitch: 38, zone: 1, order: 60, line: 4, shape: 'o', label: 'SN', name: 'Snare' }],
  [40, { repPitch: 38, zone: 2, order: 61, line: 4, shape: 'o', label: 'SN', name: 'Snare' }],
  // Tom 1
  [48, { repPitch: 48, zone: 1, order: 90, line: 2, shape: 'o', label: 'T1', name: 'Tom 1' }],
  [50, { repPitch: 48, zone: 2, order: 91, line: 2, shape: 'o', label: 'T1', name: 'Tom 1' }],
  // Tom 2
  [45, { repPitch: 45, zone: 1, order: 100, line: 3, shape: 'o', label: 'T2', name: 'Tom 2' }],
  [47, { repPitch: 45, zone: 2, order: 101, line: 3, shape: 'o', label: 'T2', name: 'Tom 2' }],
  // Stand tom 1
  [43, { repPitch: 43, zone: 1, order: 70, line: 5, shape: 'o', label: 'ST1', name: 'Stand Tom 1' }],
  [58, { repPitch: 43, zone: 2, order: 71, line: 5, shape: 'o', label: 'ST1', name: 'Stand Tom 1' }],
  // Stand tom 2
  [39, { repPitch: 41, zone: 1, order: 80, line: 6, shape: 'o', label: 'ST2', name: 'Stand Tom 2' }],
  [41, { repPitch: 41, zone: 2, order: 81, line: 6, shape: 'o', label: 'ST2', name: 'Stand Tom 2' }],
  // Bass drum
  [35, { repPitch: 36, zone: 1, order: 110, line: 8, shape: 'o', label: 'BD', name: 'Bass Drum' }],
  [36, { repPitch: 36, zone: 2, order: 111, line: 8, shape: 'o', label: 'BD', name: 'Bass Drum' }]
])
