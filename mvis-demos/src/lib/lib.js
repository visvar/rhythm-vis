
/**
 * Converts seconds per beat to beats per minute (BPM)
 *
 * @param {number} seconds seconds per beat
 * @returns {number} beat per minute (BPM)
 */
export function secondsPerBeatToBpm(seconds) {
  return 60 * 1 / seconds
}
