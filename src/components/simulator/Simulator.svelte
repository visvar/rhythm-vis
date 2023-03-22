<script>
  import { MusicPiece, Utils } from 'musicvis-lib';
  import HistogramPlot from '../analysis/HistogramPlot.svelte';
  import TickPlot from '../analysis/TickPlot.svelte';
  import DeltaTimeHistogramPlot from '../analysis/DeltaTimeHistogramPlot.svelte';
  import MainPlot from '../analysis/MainPlot.svelte';
  import AggregatedPlot from '../analysis/AggregatedPlot.svelte';
  import NoteDurationHistogramPlot from '../analysis/NoteDurationHistogramPlot.svelte';
  import { group, max, range, some } from 'd3';
  import SheetMusic from '../common/SheetMusic.svelte';
  import PianoRoll from '../common/PianoRoll.svelte';
  import Filter from '../analysis/Filter.svelte';
  import MultiSelect from '../common/MultiSelect.svelte';
  import GroundTruthPlot from '../analysis/GroundTruthPlot.svelte';
  import AudioPlayer2 from '../analysis/AudioPlayer2.svelte';
  import DensityPlot from '../analysis/DensityPlot.svelte';
  import DensityPlotSeparate from '../analysis/DensityPlotSeparate.svelte';
  import TempoEstimation from '../analysis/TempoEstimation.svelte';
  import ScatterPlot from '../analysis/ScatterPlot.svelte';
  import NoteDistanceBars from '../analysis/NoteDistanceBars.svelte';
  import ExerciseAudio from '../recorder/ExerciseAudio.svelte';

  export let exercises;

  let filterBy = '';

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
    exerciseNoteOnsetsInBeats = [
      ...exerciseNotes.map((d) => d.start / spb),
      mp.duration,
    ];
  };
  $: {
    if (exercise) {
      loadExerciseXml(exercise);
    }
  }

  // data
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

  const filterExercises = (names, by) => {
    const search = by.split(/\s+/);
    return [...names.filter((d) => some(search, (s) => d.includes(s)))];
  };
</script>

<main>
  <h2>Simulator</h2>

  <div>
    <label>
      Exercise:
      <select
        bind:value="{exercise}"
        on:input="{(e) => localStorage.setItem('exercise', e.target.value)}"
      >
        <option value="" disabled>select an exercise</option>
        {#each filterExercises(exercises, filterBy) as ex}
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

  <SheetMusic exercise="{exercise}" />
  <ExerciseAudio exercise="{exercise}" bpm="{bpm}" />

  <MultiSelect options="{views}" bind:values="{currentViews}" label="Views:" />

  {#if currentViews.has('Exercise')}
    <SheetMusic
      exercise="{exercise}"
      exerciseXml="{exerciseXml}"
      showDownloadButton="{false}"
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
