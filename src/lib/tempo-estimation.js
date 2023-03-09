import { Utils } from 'musicvis-lib'
// import Essentia from 'essentia.js'
// import { EssentiaWASM } from 'essentia.js'

/**
 * @see https://github.com/JMPerez/beats-audio-api
 * @param {*} notes
 * @param {number} [targetBpm] the tempo that the player was supposed to be in
 */
export function estimateBpmFromNotes (notes, targetBpm = null) {
  if (!notes || !notes.length) {
    return []
  }
  let notes2 = [...notes].sort((a, b) => b.velocity - a.velocity)
  notes2 = notes2.slice(0, notes2.length / 4)
  notes2.sort((a, b) => a.start - b.start)
  const onsets = notes2.map(d => d.start)
  const deltas = onsets.slice(1).map((d, i) => d - onsets[i])
  let bpms = deltas
    .map(d => Utils.roundToNDecimals(60 / d, 1))
    // .map(d => 60 / d)
    .filter(d => d > 30 && d < 240)
  // const grps = groups(bpms, d => d)
  //   .sort((a, b) => b[1].length - a[1].length)
  // return grps
  if (!targetBpm) {
    return bpms
  }
  // aggregate to some range around targetBpm
  const lower = 0.8 * targetBpm
  const higher = 1.2 * targetBpm
  bpms = bpms.map(d => {
    while (d < lower) {
      d *= 2
    }
    while (d > higher) {
      d /= 2
    }
    return d
  })
  return bpms.filter(d => d > lower && d < higher)
}


/**
 * Computes the variance of notes between rows.
 * Can be used as a score of playing consitency
 * @todo consider timeAlignment
 * @param {*} notes
 * @param {*} bpm
 */
export function noteAlignmnet (notes, bpm, beatsPerRow) {
  // get rows
  const spb = 60 / bpm
  const noteOnsets = notes.map(d => (d.start * spb) % beatsPerRow)

}

export function estimateBpmToGetAlignment (notes) {

}

// export function estimateBpmFromAudio (audioBlob) {
//   const es = new Essentia(EssentiaWASM)
//   console.log(es)

// }
