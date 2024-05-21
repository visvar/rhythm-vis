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

/**
 * Allows to wait for a number of seconds with async/await
 * IMPORTANT: This it not exact, it will at *least* wait for X seconds
 *
 * @param {number} seconds number of seconds to wait
 * @returns {Promise} empty Promise that will resolve after the specified amount
 *      of seconds
 */
export function delay(seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

/**
 * Update a set by toggling the item
 * @param {Set} set a Set
 * @param {*} item an item
 * @returns {Set} updated Set
*/
export function updSet(set, item) {
  if (set.has(item)) {
    set.delete(item)
  } else {
    set.add(item)
  }
  return new Set(set)
};

/**
 * Returns true if the Set contains any of the given items
 * @param {Set} set a Set
 * @param {*} values values
 * @returns {boolean} true if Set contains any of the values
 */
export function setHasAny(set, values) {
  for (const v of values) {
    if (set.has(v)) {
      return true
    }
  }
  return false
};
