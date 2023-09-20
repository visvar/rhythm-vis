export function generatePattern(
  // number of notes to generate
  notes = 16,
  // initial time between two notes, changes when tempoChange != 0
  noteOffset = 0.5,
  // value in seconds the noteOffset changes after each note
  tempoChange = 0,
  // index of the note that should be shifted
  wrongNoteIndex = 0,
  // value in seconds the note should be shifted
  noteDeviation = 0,
  // to allow the first note to be shifted, there will be a bit of silence added to the start
  paddingStart = 0.1
) {
  const noteTimes = []
  for (let note = 0; note < notes; ++note) {
    let noteTime = note * noteOffset
    if (note === wrongNoteIndex) {
      noteTime += noteDeviation
    }
    noteTimes.push(noteTime)
    // prevent negative tempo
    noteOffset = Math.max(0.001, noteOffset + tempoChange)
  }
  return noteTimes.map((d) => d + paddingStart)
}

export function simulate(instrument, noteTimes) {
  // prepare rendering
  const duration = noteTimes.at(-1) + 1
  const data = instrument.getChannelData(0)
  const result = new Float32Array(Math.ceil(duration * instrument.sampleRate))

  // render audio
  for (const noteStart of noteTimes) {
    const frameIndex = Math.round(noteStart * instrument.sampleRate)
    for (let i = 0; i < data.length; ++i) {
      result[frameIndex + i] = data[i]
    }
  }
  return result
}




pattern = generatePattern(
  notes,
  noteOffset,
  tempoChange,
  wrongNoteIndex,
  noteDeviation,
)



data = simulate(instrument, pattern)
