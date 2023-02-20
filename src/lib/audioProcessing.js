/**
 * Inserts a span of silence into an audio Blob, shifting everything after the silence to a later time.
 *
 * @param {Blob} blob blobcontaining the audio data
 * @param {number} start start time in seconds
 * @param {number} end end time in seconds
 * @returns {Promise<Blob>} blob with audio/wav format
 */
export async function insertSilence(blob, start, end) {
  const buffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const decoded = await audioContext.decodeAudioData(buffer)
  const channelCount = decoded.numberOfChannels
  // compute start and end values in seconds
  const computedStart = decoded.length * start / decoded.duration
  const computedEnd = decoded.length * end / decoded.duration
  const newBuffer = audioContext.createBuffer(
    channelCount,
    decoded.length + computedEnd - computedStart,
    decoded.sampleRate
  )
  // insert silence by shifting
  for (let i = 0; i < channelCount; i++) {
    const data = decoded.getChannelData(i)
    newBuffer.copyToChannel(
      data.slice(0, computedStart),
      i
    )
    newBuffer.copyToChannel(
      data.slice(computedStart, decoded.length),
      i,
      computedEnd
    )
  }
  return audioBufferToWavBlob(channelCount, newBuffer)
}

/**
 * Removes a slice of an audio Blob by moving everything that comes after to an earlier time
 * @param {Blob} blob blobcontaining the audio data
 * @param {number} start start time in seconds
 * @param {number} end end time in seconds
 * @returns {Promise<Blob>} blob with audio/wav format
 */
export async function removeSlice(blob, start, end) {
  const buffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const decoded = await audioContext.decodeAudioData(buffer)
  const channelCount = decoded.numberOfChannels
  // compute start and end values in seconds
  const computedStart = decoded.length * start / decoded.duration
  const computedEnd = decoded.length * end / decoded.duration
  const newBuffer = audioContext.createBuffer(
    channelCount,
    decoded.length - (computedEnd - computedStart),
    decoded.sampleRate
  )
  // remove slice by shifting
  for (let i = 0; i < channelCount; i++) {
    const data = decoded.getChannelData(i)
    newBuffer.copyToChannel(
      data.slice(0, computedStart),
      i
    )
    newBuffer.copyToChannel(
      data.slice(computedEnd, decoded.length),
      i,
      computedStart
    )
  }
  return audioBufferToWavBlob(channelCount, newBuffer)
}

/**
 * Removes a slice of an audio Blob by moving everything that comes after to an earlier time
 * @param {Blob} blob blobcontaining the audio data
 * @param {number[][]} breaks as [start, end] in seconds
 * @returns {Promise<Blob>} blob with audio/wav format
 */
export async function removeSlices(blob, breaks) {
  const buffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const decoded = await audioContext.decodeAudioData(buffer)
  const channelCount = decoded.numberOfChannels
  // compute start and end values in seconds
  const breaksInFrames = breaks.map(([start, end]) => [
    decoded.length * start / decoded.duration,
    decoded.length * end / decoded.duration

  ])
  let totalCutLength = 0
  for (const [start, end] of breaksInFrames) {
    totalCutLength += end - start
  }
  const newBuffer = audioContext.createBuffer(
    channelCount,
    decoded.length - totalCutLength,
    decoded.sampleRate
  )
  // remove slice by shifting
  for (let i = 0; i < channelCount; i++) {
    const data = decoded.getChannelData(i)
    newBuffer.copyToChannel(
      data.slice(0, breaksInFrames[0][0]),
      i
    )
    for (let b = 1; b < breaks.length; b++) {
      const [lastBreakStart, lastBreakEnd] = breaks[b - 1]
      const [breakStart] = breaks[b]
      newBuffer.copyToChannel(
        data.slice(lastBreakEnd, breakStart),
        i,
        lastBreakStart
      )
    }
    const [lastBreakStart, lastBreakEnd] = breaks.at(-1)
    newBuffer.copyToChannel(
      data.slice(lastBreakEnd, decoded.length),
      i,
      lastBreakStart
    )
  }
  return audioBufferToWavBlob(channelCount, newBuffer)
}

/**
 * Cuts a section from an audio Blob and returns it as WAV Blob.
 *
 * @param {Blob} blob blobcontaining the audio data
 * @param {number} start start time in seconds
 * @param {number} end end time in seconds
 * @returns {Promise<Blob>} blob with audio/wav format
 * @todo only supports one or two channels, not more
 * @see https://github.com/lubenard/simple-mp3-cutter/blob/master/src/cutter.js
 * @see https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download
 */
export async function cut(blob, start, end) {
  const buffer = await blob.arrayBuffer()
  const audioContext = new AudioContext()
  const decoded = await audioContext.decodeAudioData(buffer)
  const channelCount = decoded.numberOfChannels
  // compute start and end values in seconds
  const computedStart = decoded.length * start / decoded.duration
  const computedEnd = decoded.length * end / decoded.duration
  const newBuffer = audioContext.createBuffer(
    channelCount,
    computedEnd - computedStart,
    decoded.sampleRate
  )
  // cut audio samples
  for (let i = 0; i < channelCount; i++) {
    newBuffer.copyToChannel(decoded.getChannelData(i).slice(computedStart, computedEnd), i)
  }
  return audioBufferToWavBlob(channelCount, newBuffer)
}

/**
 * Converts an AudioBuffer to a Blob with audio/wav format, interleaving channels when there are more than one.
 *
 * @todo does not support more than two channels, will ommit any further ones
 * @param {number} channelCount number of audio channels
 * @param {AudioBuffer} buffer audio buffer
 * @returns {Blob} blob with audio/wav format
 */
function audioBufferToWavBlob(channelCount, buffer) {
  // interleave samples when there are multiple channels
  let interleaved
  if (channelCount === 1) {
    interleaved = buffer.getChannelData(0)
  } else {
    const [left, right] = [buffer.getChannelData(0), buffer.getChannelData(1)]
    interleaved = new Float32Array(left.length + right.length)
    for (let src = 0, dst = 0; src < left.length; src++, dst += 2) {
      interleaved[dst] = left[src]
      interleaved[dst + 1] = right[src]
    }
  }
  // get WAV file bytes and audio params of your audio source
  const wavBytes = getWavBytes(interleaved.buffer, {
    isFloat: true,
    numChannels: channelCount === 1 ? 1 : 2,
    sampleRate: 48000
  })
  return new Blob([wavBytes], { type: 'audio/wav' })
}

// Returns Uint8Array of WAV bytes
function getWavBytes(buffer, options) {
  const type = options.isFloat ? Float32Array : Uint16Array
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT
  const headerBytes = getWavHeader({ ...options, numFrames })
  // const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }))
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength)
  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0)
  wavBytes.set(new Uint8Array(buffer), headerBytes.length)
  return wavBytes
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
function getWavHeader(options) {
  const numFrames = options.numFrames
  const numChannels = options.numChannels || 2
  const sampleRate = options.sampleRate || 44100
  const bytesPerSample = options.isFloat ? 4 : 2
  const format = options.isFloat ? 3 : 1
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = numFrames * blockAlign
  const buffer = new ArrayBuffer(44)
  const dv = new DataView(buffer)
  let p = 0
  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i))
    }
    p += s.length
  }
  function writeUint32(d) {
    dv.setUint32(p, d, true)
    p += 4
  }
  function writeUint16(d) {
    dv.setUint16(p, d, true)
    p += 2
  }
  // ChunkID
  writeString('RIFF')
  // ChunkSize
  writeUint32(dataSize + 36)
  // Format
  writeString('WAVE')
  // Subchunk1ID
  writeString('fmt ')
  // Subchunk1Size
  writeUint32(16)
  // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(format)
  // NumChannels
  writeUint16(numChannels)
  // SampleRate
  writeUint32(sampleRate)
  // ByteRate
  writeUint32(byteRate)
  // BlockAlign
  writeUint16(blockAlign)
  // BitsPerSample
  writeUint16(bytesPerSample * 8)
  // Subchunk2ID
  writeString('data')
  // Subchunk2Size
  writeUint32(dataSize)
  return new Uint8Array(buffer)
}
