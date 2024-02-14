import * as d3 from "d3"

// export function generatePattern(
//   // number of notes to generate
//   notes = 16,
//   // initial time between two notes, changes when tempoChange != 0
//   ioi = 0.5,
//   // value in seconds the noteOffset changes after each note
//   tempoChange = 0,
//   // index of the note that should be shifted
//   wrongNoteIndex = 0,
//   // value in seconds the note should be shifted
//   noteDeviation = 0,
//   // to allow the first note to be shifted, there will be a bit of silence added to the start
//   paddingStart = 0.1
// ) {
//   const noteTimes = []
//   for (let note = 0; note < notes; ++note) {
//     let noteTime = note * ioi
//     if (note === wrongNoteIndex) {
//       noteTime += noteDeviation
//     }
//     noteTimes.push(noteTime)
//     // prevent negative tempo
//     ioi = Math.max(0.001, ioi + tempoChange)
//   }
//   return noteTimes.map((d) => d + paddingStart)
// }

import AudioDecode from 'audio-decode'
import AudioBufferToWav from 'audiobuffer-to-wav'

/**
 * Shifts a note while keeping others in regular pattern or also shifting the
 * following notes
 * @param {*} notes
 * @param {*} ioi
 * @param {*} wrongNoteIndex
 * @param {*} noteDeviation
 * @param {boolean} shiftFollowing
 * @param {*} paddingStart
 * @returns
 */
export function generatePatternSimple (
  // number of notes to generate
  notes = 16,
  // time between two notes in seconds
  ioi = 0.5,
  // index of the note that should be shifted
  wrongNoteIndex = 0,
  // value in seconds the note should be shifted
  noteDeviation = 0,
  // also shift the following notes by the same offset?
  shiftFollowing = false,
  // to allow the first note to be shifted, there will be a bit of silence added to the start
  paddingStart = 0
) {
  const noteTimes = []
  for (let note = 0; note < notes; ++note) {
    let dev
    if (shiftFollowing) {
      dev = note >= wrongNoteIndex ? noteDeviation : 0
    } else {
      dev = note === wrongNoteIndex ? noteDeviation : 0
    }
    noteTimes.push(note * ioi + paddingStart + dev)
  }
  return noteTimes
}

export async function fetchAudio (audioFile) {
  const res = await fetch(audioFile)
  const buffer = await res.arrayBuffer()
  const audioSample = await AudioDecode(buffer)
  return audioSample
};

/**
 * Simulates the note pattern as audio
 * @param {AudioBuffer} instrument
 * @param {number[]} noteTimes
 * @param {number} paddingEnd how much time to render after the last note onset
 * @returns
 */
export function simulate (instrument, noteTimes, paddingEnd = 1) {
  // prepare rendering
  const duration = noteTimes.at(-1) + paddingEnd
  const data = instrument.getChannelData(0)
  const result = new Float32Array(Math.ceil(duration * instrument.sampleRate))

  // render audio
  for (const noteStart of noteTimes) {
    const frameIndex = Math.round(noteStart * instrument.sampleRate)
    let decayFactor = 1
    for (let i = 0; i < data.length; ++i) {
      // result[frameIndex + i] = data[i]
      // const current = result[frameIndex + i]
      // if (Math.abs(current) > Math.abs(data[i])) {
      //   result[frameIndex + i] = current
      // } else {
      decayFactor = Math.max(0, decayFactor - 2 / 40_100)
      result[frameIndex + i] = data[i] * decayFactor
      // }
    }
  }
  return result
}

export function audioDataToAudioEl (audioData, sampleRate, audioEl) {
  const buffer = new AudioBuffer({ sampleRate, length: audioData.length })
  buffer.copyToChannel(audioData, 0)
  const blob = new Blob([AudioBufferToWav(buffer)], {
    type: 'audio/wav'
  })
  audioEl.src = window.URL.createObjectURL(blob)
}

/**
 * Shuffles the given array (not in-place) and return the shuffled version
 * @param {Array} array an Array
 * @returns {Array} shuffled
 */
export function shuffleArray (array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
}

/**
 * Simulates the note pattern as audio
 * @param {AudioBuffer[]} instruments array of audio buffers
 * @param {number[][]} noteTimes times for each instrument
 * @param {number} paddingEnd how much time to render after the last note onset
 * @returns
 */
export function simulateDrum (instruments, noteTimes, paddingEnd) {
  // prepare rendering
  const duration = d3.max(noteTimes.flat()) + paddingEnd

  const result = new Float32Array(Math.ceil(duration * instruments[0].sampleRate))

  const data = instrument.getChannelData(0)

  // render audio
  for (const noteStart of noteTimes) {
    const frameIndex = Math.round(noteStart * instrument.sampleRate)
    let decayFactor = 1
    for (let i = 0; i < data.length; ++i) {
      // result[frameIndex + i] = data[i]
      // const current = result[frameIndex + i]
      // if (Math.abs(current) > Math.abs(data[i])) {
      //   result[frameIndex + i] = current
      // } else {
      decayFactor = Math.max(0, decayFactor - 2 / 40_100)
      result[frameIndex + i] = data[i] * decayFactor
      // }
    }
  }
  return result
}
