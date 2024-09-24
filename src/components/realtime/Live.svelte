<script>
  import { onMount, onDestroy } from 'svelte';
  import Metronome from '../../lib/Metronome.js';
  import SheetMusic from '.../common/SheetMusic.svelte';
  import { WebMidi } from 'webmidi';
  import ExerciseAudio from '../recorder/ExerciseAudio.svelte';
  import { max, some } from 'd3';
  import { MusicPiece, Utils } from 'musicvis-lib';
  import MainPlot from '../analysis/MainPlot.svelte';
  import DensityPlot from '../analysis/DensityPlot.svelte';
  import DensityPlotSeparate from '../analysis/DensityPlotSeparate.svelte';

  const exercises = [
    // Run preprocessing/exercise-summary.py for a list
    'any-instrument_empty_exercise',
    'drum_4-4_polyrhythm',
    'drum_snare_eighths-to-eighth-triplets',
    'drum_snare_eighths-to-quarter-quintuplets',
    'drum_song-1_mixed-notes',
    'drum_song-2_mixed-notes',
    'drums_3-4-walz_quarters',
    'drums_4-4-multi-bar_simple-fill',
    'drums_4-4-multi-bar_triplet-fill',
    'drums_4-4-offbeat_eighths',
    'drums_4-4-short-fill_eighths-triplets',
    'drums_4-4-snare_eighths-triplets',
    'drums_4-4-standard-halftime_eighths',
    'drums_4-4-standard-offbeat_eighths',
    'guitar_a-blues_eighths',
    'guitar_a-minor-pentatonic_eighth-triplets',
    'guitar_a-minor-pentatonic_eighths',
    'guitar_a-minor_eighths',
    'guitar_autumn-chords_halfs',
    'guitar_chords-f7_halfs',
    'guitar_chords-fm7_halfs',
    'guitar_e-string_eighths-to-eighth-triplets',
    'guitar_e-string_quarters',
    'guitar_e-string_quarters-to-eighths',
    'guitar_powerchords_quarter-to-eighths-with-rest',
    'guitar_single-notes_eighths-to-eighth-triplets',
    'piano_c-major_eighths',
  ];
  let filterBy = '';

  let width;
  // Data
  let notes = [];
  // Metronome
  let metroDiv;
  let metro = new Metronome();
  // Recorders
  let isRecording = false;
  let recordingStartTime;
  const onEnabled = () => {
    console.log(`MIDI enabled`);
    for (const input of WebMidi.inputs) {
      input.addListener('noteon', (e) => {
        const startInSeconds = (e.timestamp - recordingStartTime) / 1000;
        const newNote = {
          port: e.port.name,
          channel: e.message.channel,
          pitch: e.note.number,
          name: e.note.identifier,
          start: startInSeconds,
          end: startInSeconds + 1,
          duration: 1,
          velocity: e.note.attack,
        };
        notes = [...notes, newNote];
      });
    }
  };
  // Settings
  let exercise = localStorage.getItem('exercise') ?? '';
  let bpm = +(localStorage.getItem('bpm') ?? 120);
  let beep = +(localStorage.getItem('beep') ?? 1);
  let accent = +(localStorage.getItem('accent') ?? 1);
  let beepLimit = localStorage.getItem('beepLimit') ?? 'infinite';

  // config
  let exerciseXml;
  let exerciseNotes;
  let exerciseNoteOnsetsInBeats = [];
  let beats = 4;
  let contextBeats = 1;
  let noteColorMode = 'none';
  let noteThicknessMode = 'velocity';
  $: xTicks = exercise !== 'any-instrument_empty_exercise' ? 'exercise' : 1;
  let rowLimit = 10;
  const loadExerciseXml = async (exercise) => {
    // load exercise XML when exercise changes
    const url = window.location.pathname;
    exerciseXml = await (await fetch(`${url}/musicxml/${exercise}.xml`)).text();
    // get number of beats from exercise
    const mp = MusicPiece.fromMusicXml('ex', exerciseXml);
    const quartersPerBar = mp.timeSignatures[0].signature[0];
    const barCount = max(mp.xmlMeasureIndices) + 1;
    beats = barCount * quartersPerBar;
    contextBeats = Math.ceil(beats / 8);
    // get notes from exercise and scale to current bpm
    const durationWithoutRep = beats * Utils.bpmToSecondsPerBeat(120);
    const tempoFactor = mp.tempos[0].bpm / bpm;
    exerciseNotes = mp.tracks[0].notes
      .filter((d) => d.start < durationWithoutRep)
      .map((d) => {
        return {
          ...d,
          start: d.start * tempoFactor,
          end: d.end * tempoFactor,
          duration: (d.end - d.start) * tempoFactor,
        };
      });
    exerciseNoteOnsetsInBeats = exerciseNotes.map((d) => d.start / spb);
  };
  $: {
    if (exercise) {
      loadExerciseXml(exercise);
    }
  }

  // data
  let unfilteredNotes = [];
  $: spb = Utils.bpmToSecondsPerBeat(bpm);
  $: onsets = notes.map((d) => d.start);
  $: onsetsInBeats = onsets.map((d) => d / spb - timeAlignment);
  let timeAlignment = 0;
  let selectionEndTime = null;
  let currentTimeInBeats = 0;

  onMount(async () => {
    // enable MIDI and audio access
    try {
      await WebMidi.enable();
      onEnabled();
    } catch (e) {
      console.error('Cannot enable MIDI recording');
      console.error(e);
    }
  });

  const start = () => {
    isRecording = true;
    notes = [];
    recordingStartTime = performance.now();
    metro.start(
      bpm / beep,
      accent,
      beepLimit === 'infinite' ? Infinity : +beepLimit,
    );
    console.log('start', recordingStartTime);
  };

  const stop = async () => {
    console.log('stop');
    metro.stop();
    isRecording = false;
  };

  onDestroy(() => {
    // remove MIDI listeners to avoid duplicate calls and improve performance
    for (const input of WebMidi.inputs) {
      input.removeListener();
    }
  });

  const filterExecises = (names, by) => {
    const search = by.split(/\s+/);
    return [...names.filter((d) => some(search, (s) => d.includes(s)))];
  };
</script>

<main bind:clientWidth="{width}">
  <h2>Live</h2>

  <div>
    <label>
      Exercise:
      <select
        bind:value="{exercise}"
        on:input="{(e) => localStorage.setItem('exercise', e.target.value)}"
      >
        <option value="" disabled>select an exercise</option>
        {#each filterExecises(exercises, filterBy) as ex}
          <option value="{ex}">{ex}</option>
        {/each}
      </select>
    </label>
    <label>
      Filter:
      <input
        type="text"
        placeholder="space-separated words"
        bind:value="{filterBy}"
      />
    </label>
  </div>

  <SheetMusic {exercise} />
  <ExerciseAudio {exercise} {bpm} />

  <div bind:this="{metroDiv}" class="metronome">
    Metronome:
    <input
      bind:value="{bpm}"
      on:input="{(e) => localStorage.setItem('bpm', e.target.value)}"
      type="number"
      min="30"
      max="240"
      step="10"
      style="width: 50px"
    />
    bpm, beep on every
    <input
      bind:value="{beep}"
      on:input="{(e) => localStorage.setItem('beep', e.target.value)}"
      type="number"
      min="1"
      max="16"
      step="1"
      style="width: 30px"
    />. beat, accent on every
    <input
      bind:value="{accent}"
      on:input="{(e) => localStorage.setItem('accent', e.target.value)}"
      type="number"
      min="1"
      max="16"
      step="1"
      style="width: 30px"
    />. beep, limit to
    <select
      bind:value="{beepLimit}"
      on:input="{(e) => localStorage.setItem('beepLimit', e.target.value)}"
    >
      <option value="infinite">infinite</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="6">6</option>
      <option value="8">8</option>
    </select>
    beeps
  </div>

  <div>
    <button on:click="{() => (isRecording ? stop() : start())}">
      {isRecording ? 'stop' : 'start recording'}
    </button>
  </div>

  <label title="Number of beats per row">
    beats per row
    <input
      bind:value="{beats}"
      type="number"
      min="1"
      max="100"
      step="1"
      style="width: 50px"
    />
  </label>

  <label title="How many beats to show left and right as context">
    context beats
    <input
      bind:value="{contextBeats}"
      type="number"
      min="0"
      max="8"
      step="1"
      style="width: 50px"
    />
  </label>

  <label title="Note color mode">
    color
    <select bind:value="{noteColorMode}">
      {#each ['none', 'chroma', 'pitch', 'drums', 'drumsType', 'channel', 'velocity', 'duration', 'device', 'error'] as value}
        <option {value}>{value}</option>
      {/each}
    </select>
  </label>

  <label title="Note thickness mode">
    thickness
    <select bind:value="{noteThicknessMode}">
      {#each ['none', 'velocity', 'duration'] as value}
        <option {value}>{value}</option>
      {/each}
    </select>
  </label>

  <label>
    x axis ticks
    <select bind:value="{xTicks}">
      <option value="exercise">exercise</option>
      <option value="{1 / 1}">beats</option>
      <option value="{1 / 2}">half-beats</option>
      <option value="{1 / 3}">triplets</option>
      <option value="{1 / 4}">quarter-beats</option>
      <option value="{1 / 5}">quintuplets</option>
      <option value="{1 / 6}">sextuplets</option>
      <option value="{1 / 7}">septuplets</option>
      <option value="{1 / 8}">eighth-beats</option>
    </select>
  </label>

  <label>
    row limit
    <input
      bind:value="{rowLimit}"
      type="number"
      min="0"
      max="100"
      step="1"
      style="width: 50px"
    />
  </label>

  <DensityPlot
    {width}
    values="{onsetsInBeats}"
    {beats}
    {contextBeats}
    xLabel="beats"
  />

  <DensityPlotSeparate
    {width}
    {notes}
    {onsetsInBeats}
    {beats}
    {xTicks}
    {exerciseNoteOnsetsInBeats}
  />

  <MainPlot
    {width}
    {notes}
    {onsetsInBeats}
    {exerciseNoteOnsetsInBeats}
    {beats}
    {contextBeats}
    {noteColorMode}
    thicknessMode="{noteThicknessMode}"
    {xTicks}
    bind:currentTimeInBeats
    bind:selectionEndTime
    {rowLimit}
  />
</main>

<style>
  main {
    padding: 0;
  }

  .metronome {
    background: none;
    border-radius: 5px;
  }
</style>
