<script>
  import { MusicPiece, Utils } from 'musicvis-lib';
  import { onMount } from 'svelte';
  import HistogramPlot from './HistogramPlot.svelte';
  import TickPlot from './TickPlot.svelte';
  import DeltaTimeHistogramPlot from './DeltaTimeHistogramPlot.svelte';
  import MainPlot from './MainPlot.svelte';
  import AggregatedPlot from './AggregatedPlot.svelte';
  import NoteDurationHistogramPlot from './NoteDurationHistogramPlot.svelte';
  import { group, max, some } from 'd3';
  import SheetMusic from '../common/SheetMusic.svelte';
  import PianoRoll from '../common/PianoRoll.svelte';
  import { readJsonFile } from '../../lib/files';
  import Filter from './Filter.svelte';
  import MultiSelect from '../common/MultiSelect.svelte';
  import GroundTruthPlot from './GroundTruthPlot.svelte';
  import AudioPlayer2 from './AudioPlayer2.svelte';
  import DensityPlot from './DensityPlot.svelte';
  import DensityPlotSeparate from './DensityPlotSeparate.svelte';
  import ExerciseNotepad from '../common/ExerciseNotepad.svelte';
  import TempoEstimation from './TempoEstimation.svelte';
  import ScatterPlot from './ScatterPlot.svelte';
  import NoteDistanceBars from './NoteDistanceBars.svelte';

  export let dataDirectoryHandle = null;

  // views etc
  let width = window.innerWidth - 100;
  let views = [
    'Exercise',
    'Notepad',
    'Filter',
    // 'Histogram',
    // 'Ticks',
    'Density',
    'Ground truth',
    'Main',
    'Note Distance',
    'Scatterplot',
    'Aggregated',
    'Density Separate',
    'Time diff.',
    // 'Durations',
    'Piano roll',
    'Tempo Estimation',
  ];
  let currentViews = localStorage.getItem('currentViews')
    ? new Set(localStorage.getItem('currentViews').split(','))
    : new Set([
        'Exercise',
        'Notepad',
        'Filter',
        // 'Ground truth',
        'Density',
        'Main',
        'Note Distance',
        // 'Aggregated',
        // 'Density Separate',
      ]);
  $: {
    localStorage.setItem('currentViews', [...currentViews].join(','));
  }

  // config
  let exercise;
  let exerciseXml;
  let exerciseNotes;
  let exerciseNoteOnsetsInBeats = [];
  let midiSource = 'recorded';
  let bpm = 120;
  let beats = 4;
  let contextBeats = 1;
  let noteColorMode = 'none';
  let noteThicknessMode = 'velocity';
  $: xTicks = exercise !== 'any-instrument_empty_exercise' ? 'exercise' : 1;
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
  let recordings = new Map();
  let sortBy = 'date';
  let filterBy = '';
  let currentRecName;
  let unfilteredNotes = [];
  let notes = [];
  let metroClicks = [];
  let metroAccents = [];
  let audio = null;
  $: spb = Utils.bpmToSecondsPerBeat(bpm);
  $: onsets = notes.map((d) => d.start);
  $: onsetsInBeats = onsets.map((d) => d / spb - timeAlignment);
  let timeAlignment = 0;
  let currentTimeInBeats = 0;
  let selectionStartTime = null;
  let selectionEndTime = null;
  let notesInSelection;
  let onsetsInSelection;
  // TODO:
  $: {
    notesInSelection = [];
    onsetsInSelection = [];
  }

  // extract selected file from zip and get data
  const handleFileSelect = async (recName) => {
    console.log(recName);
    currentRecName = null;
    notes = [];
    metroClicks = [];
    metroAccents = [];
    audio = null;
    currentTimeInBeats = 0;
    selectionStartTime = null;
    selectionEndTime = null;
    const files = recordings.get(recName);
    if (!files) {
      return;
    }
    for (const file of files) {
      if (midiSource === 'converted' && file.name.endsWith('.conv.rec.json')) {
        // notes from converter
        notes = await readJsonFile(file.handle);
      } else if (midiSource === 'recorded' && file.name.endsWith('.rec.json')) {
        // notes from recorder
        notes = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.clicks.json')) {
        // metronome clicks
        metroClicks = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.accents.json')) {
        // metronome accents
        metroAccents = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.audio.weba')) {
        // audio
        const f = await file.handle.getFile();
        const buffer = await f.arrayBuffer();
        audio = new Blob([buffer]);
      }
    }
    notes.sort((a, b) => a.start - b.start);
    unfilteredNotes = notes;
    // read exercise parameters from file name
    currentRecName = recName;
    const fileName = files[0].name.substring(0, files[0].name.indexOf('.'));
    const [ins, exc, rhy, tem, clk, acc, lim, per, dat] = fileName.split('_');
    exercise = [ins, exc, rhy].join('_');
    // bpm = +tem.replace('-bpm', '');
    bpm = +tem.split('-')[0];
    console.log({ notes, metroClicks, metroAccents, audio, exercise, bpm });
    // align beginning automatically
    const firstNoteStart = notes[0]?.start ?? 0;
    const spb = Utils.bpmToSecondsPerBeat(bpm);
    timeAlignment = Math.floor(firstNoteStart / spb);
  };

  const deleteCurrentRecording = async () => {
    if (
      confirm(
        `Are you sure you want to delete this recording?:\n\n${currentRecName}\n\nThis cannot be undone!`
      )
    ) {
      const files = recordings.get(currentRecName);
      for (const file of files) {
        dataDirectoryHandle.removeEntry(file.name);
      }
      updateRecordingList();
    }
  };

  const updateRecordingList = async () => {
    // display list of recordings to analyze
    const files = [];
    for await (const [key, value] of dataDirectoryHandle.entries()) {
      files.push({ name: key, handle: value });
    }
    // group by recording name, to get all files that the belong to the same recording
    recordings = group(files, (d) => d.name.substring(0, d.name.indexOf('.')));
  };

  onMount(() => {
    updateRecordingList();
  });

  /**
   * Sorts recordings for the select options
   * @param {string[]} recordingNames recording names
   * @param {string} by sorty by...
   */
  const sortRecs = (recordingNames, by) => {
    // const [ins, exc, rhy, tem, clk, acc, lim, per, dat] = fileName.split('_');
    if (by === 'name') {
      recordingNames.sort();
    } else if (by === 'date') {
      recordingNames.sort((a, b) =>
        a.substring(a.lastIndexOf('_'), a.lastIndexOf('-') + 2) <
        b.substring(b.lastIndexOf('_'), b.lastIndexOf('-') + 2)
          ? 1
          : -1
      );
    }
    return [...recordingNames];
  };

  const filterRecs = (recordingNames, by) => {
    const search = by.split(/\s+/);
    return [
      ...recordingNames.filter((d) => some(search, (s) => d.includes(s))),
    ];
  };
</script>

<main>
  <h2>Analysis</h2>

  <label>
    Recording:
    <select on:input="{(e) => handleFileSelect(e.target.value)}">
      <option value="" disabled selected>select a recording</option>
      {#each sortRecs(filterRecs([...recordings.keys()], filterBy), sortBy) as rName}
        <option value="{rName}">{rName}</option>
      {/each}
    </select>
  </label>
  <label>
    Sort:
    <select bind:value="{sortBy}">
      <option value="name">name</option>
      <option value="date">date</option>
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

  <MultiSelect options="{views}" bind:values="{currentViews}" label="Views:" />

  {#if currentViews.has('Exercise')}
    <SheetMusic
      exercise="{exercise}"
      exerciseXml="{exerciseXml}"
      showDownloadButton="{false}"
    />
  {/if}
  {#if currentViews.has('Notepad')}
    <ExerciseNotepad
      dataDirectoryHandle="{dataDirectoryHandle}"
      fileName="{currentRecName}"
    />
  {/if}
  {#if currentViews.has('Filter')}
    <Filter unfilteredNotes="{unfilteredNotes}" bind:notes="{notes}" />
  {/if}

  <label>
    shift by N beats
    <input
      bind:value="{timeAlignment}"
      type="number"
      step="0.1"
      style="width: 60px"
    />
  </label>

  <label>
    bpm
    <input bind:value="{bpm}" type="number" step="1" style="width: 60px" />
  </label>

  <select
    bind:value="{midiSource}"
    on:change="{() => handleFileSelect(currentRecName)}"
    title="Note data source, either recorded MIDI or converted from audio"
  >
    <option value="recorded">recorded</option>
    <option value="converted">converted</option>
  </select>

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
    <button class="near" on:click="{() => (beats = beats * 2)}">x2</button>
    <button class="near" on:click="{() => (beats = beats / 2)}">/2</button>
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
      <option value="none">none</option>
      <option value="channel">channel / string</option>
      <optgroup label="pitch">
        <option value="chroma">chroma</option>
        <option value="pitch">pitch</option>
      </optgroup>
      <optgroup label="drums">
        <option value="drums" title="e.g., tom1, tom2, cymbal1, cymbal2">
          drum parts
        </option>
        <option value="drumsType" title="e.g., tom, cymbal">
          drum part type
        </option>
      </optgroup>
      <option value="velocity">velocity / dynamics</option>
      <option value="duration">duration</option>
      <option value="device">device</option>
      <option value="error">distance to grid</option>
    </select>
  </label>

  <label title="Note thickness mode">
    thickness
    <select bind:value="{noteThicknessMode}">
      {#each ['none', 'velocity', 'duration'] as value}
        <option value="{value}">{value}</option>
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

  <AudioPlayer2
    width="{width}"
    audio="{audio}"
    bind:currentTimeInBeats="{currentTimeInBeats}"
    timeAlignment="{timeAlignment}"
    selectionEndTime="{selectionEndTime}"
    spb="{spb}"
  />

  {#if currentRecName}
    {#if currentViews.has('Histogram')}
      <HistogramPlot
        width="{width}"
        values="{onsetsInBeats}"
        beats="{beats}"
        contextBeats="{contextBeats}"
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Ticks')}
      <TickPlot
        width="{width}"
        values="{onsetsInBeats}"
        beats="{beats}"
        contextBeats="{contextBeats}"
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Density')}
      <DensityPlot
        width="{width}"
        values="{onsetsInBeats}"
        beats="{beats}"
        contextBeats="{contextBeats}"
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Ground truth')}
      <GroundTruthPlot
        width="{width}"
        notes="{exerciseNotes}"
        onsetsInBeats="{exerciseNoteOnsetsInBeats}"
        beats="{beats}"
        contextBeats="{contextBeats}"
        noteColorMode="{noteColorMode}"
        xTicks="{xTicks}"
        currentTimeInBeats="{currentTimeInBeats % beats}"
      />
    {/if}
    {#if currentViews.has('Main')}
      <MainPlot
        width="{width}"
        notes="{notes}"
        onsetsInBeats="{onsetsInBeats}"
        exerciseNoteOnsetsInBeats="{exerciseNoteOnsetsInBeats}"
        beats="{beats}"
        contextBeats="{contextBeats}"
        noteColorMode="{noteColorMode}"
        thicknessMode="{noteThicknessMode}"
        xTicks="{xTicks}"
        bind:currentTimeInBeats="{currentTimeInBeats}"
        bind:selectionStartTime="{selectionStartTime}"
        bind:selectionEndTime="{selectionEndTime}"
      />
    {/if}

    {#if currentViews.has('Note Distance')}
      <NoteDistanceBars
        width="{width}"
        notes="{notes}"
        onsetsInBeats="{onsetsInBeats}"
        noteColorMode="{noteColorMode}"
        bind:currentTimeInBeats="{currentTimeInBeats}"
        bind:selectionStartTime="{selectionStartTime}"
        bind:selectionEndTime="{selectionEndTime}"
      />
    {/if}

    {#if currentViews.has('Scatterplot')}
      <ScatterPlot
        width="{width}"
        notes="{notes}"
        onsetsInBeats="{onsetsInBeats}"
        exerciseNoteOnsetsInBeats="{exerciseNoteOnsetsInBeats}"
        beats="{beats}"
        noteColorMode="{noteColorMode}"
        thicknessMode="{noteThicknessMode}"
        xTicks="{xTicks}"
        bind:currentTimeInBeats="{currentTimeInBeats}"
        bind:selectionStartTime="{selectionStartTime}"
        bind:selectionEndTime="{selectionEndTime}"
      />
    {/if}

    {#if currentViews.has('Aggregated')}
      <AggregatedPlot
        onsetsInBeats="{onsetsInBeats}"
        beats="{beats}"
        width="{width}"
        xTicks="{xTicks}"
        exerciseNoteOnsetsInBeats="{exerciseNoteOnsetsInBeats}"
      />
    {/if}

    {#if currentViews.has('Density Separate')}
      <DensityPlotSeparate
        width="{width}"
        notes="{notes}"
        onsetsInBeats="{onsetsInBeats}"
        beats="{beats}"
        xTicks="{xTicks}"
        exerciseNoteOnsetsInBeats="{exerciseNoteOnsetsInBeats}"
      />
    {/if}

    {#if currentViews.has('Time diff.')}
      <DeltaTimeHistogramPlot width="{width}" onsetsInBeats="{onsetsInBeats}" />
    {/if}

    {#if currentViews.has('Durations')}
      <NoteDurationHistogramPlot width="{width}" notes="{notes}" />
    {/if}

    {#if currentViews.has('Piano roll')}
      <PianoRoll
        notes="{notes}"
        metronomeClicks="{metroClicks}"
        metronomeAccents="{metroAccents}"
        width="{width}"
      />
    {/if}

    {#if currentViews.has('Tempo Estimation')}
      <TempoEstimation
        notes="{notes}"
        bpm="{bpm}"
        xLabel="estimated BPM"
        bandwidth="{0.5}"
        width="{width}"
        height="{80}"
      />
    {/if}

    <h4>Recording Options</h4>
    <button
      on:click="{deleteCurrentRecording}"
      disabled="{!currentRecName}"
      style="background: #ffdecc"
    >
      delete current recording
    </button>
  {/if}
</main>

<style>
  main {
    padding: 0 10px 20px 10px;
  }
  label {
    display: inline-block;
    margin: 0 10px;
  }
</style>
