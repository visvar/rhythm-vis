import { removeSlice, removeSlices } from './audioProcessing.js'

/**
 * Detect practice breaks as time spans where there occurs no note for at least minTimeDifference seconds
 * @param {Note[]} notes notes
 * @param {number} minTimeDifference minimum time difference between consecutive note starts (seconds)
 * @returns {number[][]} Array of breaks as [start, end]
 */
export function detectBreaksInNotes(notes, minTimeDifference) {
  const breaks = []
  const sorted = [...notes].sort((a, b) => a.start - b.start)
  console.log(sorted)

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].start - notes[i - 1].start >= minTimeDifference) {
      breaks.push([notes[i - 1].start, notes[i].start])
    }
  }
  return breaks
}

/**
 * Cuts a number of seconds from the start of note and audio recording.
 * @param {Note[]} notes notes
 * @param {Blob} audio audio Blob
 * @param {number} timeToCut time to cut in seconds
 * @returns {Object} {notes, audio}
 */
export function cutStart(notes, audio, timeToCut) {
  const notesNew = notes.map(n => {
    return {
      ...n,
      start: n.start - timeToCut,
      end: n.end - timeToCut
    }
  })
  const audioNew = removeSlice(audio, 0, timeToCut)
  return { notes: notesNew, audio: audioNew }
}

/**
 * Cuts breaks from the notes and audio recording.
 * @see detectBreaksInNotes
 * @param {Note[]} notes notes
 * @param {Blob} audio audio Blob
 * @param  {number[][]} breaks Array of breaks as [start, end]
 * @returns {Object} {notes, audio}
 */
export function cutBreaks(notes, audio, breaks) {
  // copy first section
  const [start] = breaks[0]
  const notesNew = notes.filter(d => d.start <= start)
  // handle breaks
  let timeDiff = 0
  for (let b = 1; b < breaks.length; b++) {
    const [lastBreakStart, lastBreakEnd] = breaks[b - 1]
    const [breakStart] = breaks[b]
    timeDiff += lastBreakEnd - lastBreakStart
    const n = notes
      .filter(d => d.start >= lastBreakEnd && d.start <= breakStart)
      .map(d => { return { ...d, start: d.start - timeDiff, end: d.end - timeDiff } })
    notesNew.push(n)
  }
  // handle last section
  const [lastBreakStart, lastBreakEnd] = breaks.at(-1)
  timeDiff += lastBreakEnd - lastBreakStart
  const n = notes
    .filter(d => d.start >= lastBreakEnd)
    .map(d => { return { ...d, start: d.start - timeDiff, end: d.end - timeDiff } })
  notesNew.push(n)
  // audio
  const audioNew = removeSlices(audio, breaks)
  return { notes: notesNew, audio: audioNew }
}
