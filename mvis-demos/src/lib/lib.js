import * as d3 from 'd3'

/**
 * Converts seconds per beat to beats per minute (BPM)
 *
 * @param {number} seconds seconds per beat
 * @returns {number} beat per minute (BPM)
 */
export function secondsPerBeatToBpm(seconds) {
  return 60 * 1 / seconds
}

/**
 * Returns the MIDI number for all Cs between (inclusive) minMidi and maxMidi
 * @param {number} minMidi lower MIDI number
 * @param {number} maxMidi upper MIDI number
 * @returns number[]
 */
export function getCs(minMidi, maxMidi) {
  return d3.range(
    Math.ceil(minMidi / 12) * 12,
    maxMidi + 1,
    12
  )
}

/**
 * Clamps a number such that the results will always be between min and max
 * @param {number} value value
 * @param {number} min min
 * @param {number} max max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (value < min) return min
  if (value > max) return max
  return value
}
