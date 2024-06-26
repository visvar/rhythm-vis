<script>
  import { group } from 'd3';
  import { onMount } from 'svelte/internal';
  import { Midi } from 'musicvis-lib';
  import {
    BasicPitch,
    addPitchBendsToNoteEvents,
    noteFramesToTime,
    outputToNotesPoly,
  } from '@spotify/basic-pitch';

  export let dataDirectoryHandle = null;

  // const model = 'https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json';
  const model = `${window.location.pathname}/spotify-basic-pitch/model.json`;
  const basicPitch = new BasicPitch(model);
  let recordings = new Map();
  let isConverting = false;

  const updateRecordingList = async () => {
    const files = [];
    for await (const [key, value] of dataDirectoryHandle.entries()) {
      files.push({ name: key, handle: value });
    }
    recordings = group(files, (d) => d.name.substring(0, d.name.indexOf('.')));
  };

  const writeFile = async (name, data) => {
    const file = await dataDirectoryHandle.getFileHandle(name, {
      create: true,
    });
    const w = await file.createWritable();
    await w.write(data);
    w.close();
  };

  const isConverted = (recordingName) => {
    let files = recordings.get(recordingName);
    for (const file of files) {
      if (file.name.endsWith('.conv.rec.json')) {
        return true;
      }
    }
    return false;
  };

  const convert = async (recName) => {
    isConverting = true;
    try {
      const files = recordings.get(recName);
      const audioFile = files.filter((d) => d.name.endsWith('.audio.weba'));
      if (audioFile.length === 0) {
        alert(`${recName}\n\nThis recording has no audio`);
        isConverting = false;
        return;
      }
      // read audio file and convert to correct format
      const f = await audioFile[0].handle.getFile();
      const buffer = await f.arrayBuffer();
      const audioCtx = new AudioContext({
        // This samplerate is required by basic-pitch
        sampleRate: 22050,
      });
      const audioBuffer = await audioCtx.decodeAudioData(buffer);
      // run basic-pitch
      const frames = [];
      const onsets = [];
      const contours = [];
      let pct;
      await basicPitch.evaluateModel(
        audioBuffer,
        (f, o, c) => {
          frames.push(...f);
          onsets.push(...o);
          contours.push(...c);
        },
        (p) => {
          pct = p;
        }
      );
      // TODO: choose good params, see https://github.com/spotify/basic-pitch-ts/blob/main/src/toMidi.ts
      // onsetThresh: minimum amplitude of an onset activation to be considered an onset
      const onsetThresh = 0.25;
      // frameThresh: minimum amplitude of a frame activation for a note to remain "on"
      const frameThresh = 0.25;
      // minNoteLen: minimum allowed note length in frames
      const minNoteLen = 5;
      // inferOnsets: if True, add additional onsets when there are large differences in frame amplitudes
      const inferOnsets = true;
      // maxFreq: maximum allowed output frequency, in Hz
      const maxFreq = null;
      // minFreq: minimum allowed output frequency, in Hz
      const minFreq = null;
      // melodiaTrick: remove semitones near a peak
      const melodiaTrick = true;
      // energyTolerance: number of frames allowed to drop below 0
      const energyTolerance = 1;
      const notes = noteFramesToTime(
        addPitchBendsToNoteEvents(
          contours,
          outputToNotesPoly(
            frames,
            onsets,
            onsetThresh,
            frameThresh,
            minNoteLen,
            inferOnsets,
            maxFreq,
            minFreq,
            melodiaTrick,
            energyTolerance
          )
        )
      );
      // convert note format to fit Recorder's
      const notes2 = notes.map((n) => {
        return {
          pitch: n.pitchMidi,
          start: n.startTimeSeconds,
          velocity: n.amplitude,
          duration: n.durationSeconds,
          end: n.startTimeSeconds + n.durationSeconds,
          name: Midi.getMidiNoteByNr(n.pitchMidi).label,
          pitchBends: n.pitchBends,
          channel: 0,
        };
      });
      console.log('converted notes', notes2);
      await writeFile(`${recName}.conv.rec.json`, JSON.stringify(notes2));
    } catch (e) {
      alert(e);
    }
    isConverting = false;
    updateRecordingList();
  };

  const convertAll = async () => {
    for (const rec of [...recordings.keys()]) {
      if (!isConverted(rec)) await convert(rec);
    }
  };

  onMount(updateRecordingList);
</script>

<main>
  <h2>Converter</h2>
  <div>
    Converts audio to MIDI using <a
      href="https://github.com/spotify/basic-pitch-ts"
      target="_blank"
      rel="noreferrer">Spotify's basic-pitch-ts</a
    >
  </div>
  <button on:click="{convertAll}" disabled="{isConverting}">convert all</button>
  <div class="grid">
    {#each [...recordings.keys()] as recName}
      <div>
        {recName}
      </div>
      <div title="✓ already converted, ✗ not yet converted">
        {isConverted(recName) ? '✓' : '✗'}
      </div>
      <button on:click="{() => convert(recName)}" disabled="{isConverting}">
        convert
      </button>
    {/each}
  </div>
</main>

<style>
  main {
    padding: 0;
    user-select: none;
  }

  .grid {
    display: grid;
    grid-template-columns: auto 100px 100px;
  }
</style>
