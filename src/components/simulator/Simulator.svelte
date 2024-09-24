<script>
  import { MusicPiece, Utils } from 'musicvis-lib';
  import HistogramPlot from '../analysis/HistogramPlot.svelte';
  import TickPlot from '../analysis/TickPlot.svelte';
  import DeltaTimeHistogramPlot from '../analysis/DeltaTimeHistogramPlot.svelte';
  import MainPlot from '../analysis/MainPlot.svelte';
  import AggregatedPlot from '../analysis/AggregatedPlot.svelte';
  import NoteDurationHistogramPlot from '../analysis/NoteDurationHistogramPlot.svelte';
  import { max, randomNormal, some } from 'd3';
  import SheetMusic from '.../common/SheetMusic.svelte';
  import PianoRoll from '.../common/PianoRoll.svelte';
  import Filter from '../analysis/Filter.svelte';
  import MultiSelect from '.../common/MultiSelect.svelte';
  import GroundTruthPlot from '../analysis/GroundTruthPlot.svelte';
  import AudioPlayer2 from '../analysis/AudioPlayer2.svelte';
  import DensityPlot from '../analysis/DensityPlot.svelte';
  import DensityPlotSeparate from '../analysis/DensityPlotSeparate.svelte';
  import TempoEstimation from '../analysis/TempoEstimation.svelte';
  import ScatterPlot from '../analysis/ScatterPlot.svelte';
  import NoteDistanceBars from '../analysis/NoteDistanceBars.svelte';
  import ExerciseAudio from '../recorder/ExerciseAudio.svelte';
  import { onMount } from 'svelte';
  // import stdlib from '@stdlib/stdlib';
  // console.log(stdlib);
  // import ndarray from '@stdlib/ndarray/array';

  export let exercises;

  let filterBy = '';

  // views etc
  let width = window.innerWidth - 100;
  let views = [
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
  let currentViews = localStorage.getItem('currentViewsSim')
    ? new Set(localStorage.getItem('currentViewsSim').split(','))
    : new Set([
        // 'Filter',
        // 'Ground truth',
        'Density',
        'Main',
        'Note Distance',
        // 'Aggregated',
        // 'Density Separate',
      ]);
  $: {
    localStorage.setItem('currentViewsSim', [...currentViews].join(','));
  }

  // config
  let exercise;
  let exerciseXml;
  let exerciseNotes;
  let exerciseNoteOnsetsInBeats = [];
  let exerciseBeats = 4;
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
    const mp = MusicPiece.fromMusicXml('ex', exerciseXml);
    const quartersPerBar = mp.timeSignatures[0].signature[0];
    const barCount = max(mp.xmlMeasureIndices) + 1;
    beats = barCount * quartersPerBar;
    exerciseBeats = beats;
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
          velocity: d.velocity / 127,
        };
      });
    exerciseNoteOnsetsInBeats = [
      ...exerciseNotes.map((d) => d.start / spb),
      // mp.duration,
    ];
  };
  // const loadExerciseMidi = async (exercise) => {
  //   // load exercise XML when exercise changes
  //   const url = window.location.pathname;
  //   const exerciseMidi = await (
  //     await fetch(`${url}/midi/${exercise}.mid`)
  //   ).arrayBuffer();
  //   console.log(exerciseMidi);

  //   const mp = MusicPiece.fromMidi('ex', exerciseMidi);
  //   const quartersPerBar = mp.timeSignatures[0].signature[0];
  //   const barCount = max(mp.xmlMeasureIndices) + 1;
  //   beats = barCount * quartersPerBar;
  //   contextBeats = Math.ceil(beats / 8);
  //   // get notes from exercise and scale to current bpm
  //   const durationWithoutRep = beats * Utils.bpmToSecondsPerBeat(120);
  //   const tempoFactor = mp.tempos[0].bpm / bpm;
  //   exerciseNotes = mp.tracks[0].notes
  //     .filter((d) => d.start < durationWithoutRep)
  //     .map((d) => {
  //       return {
  //         ...d,
  //         start: d.start * tempoFactor,
  //         end: d.end * tempoFactor,
  //         duration: (d.end - d.start) * tempoFactor,
  //       };
  //     });
  //   exerciseNoteOnsetsInBeats = [
  //     ...exerciseNotes.map((d) => d.start / spb),
  //     mp.duration,
  //   ];
  // };
  $: {
    if (exercise) {
      loadExerciseXml(exercise);
      // loadExerciseMidi(exercise);
    }
  }

  // data
  let unfilteredNotes = [];
  let notes = [];
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

  // simulator settings
  let repetitions;
  let simBpm;
  let late;
  let drop;
  let add;
  let wobble;
  let drift;
  let tempoFactor;
  let acceleration;
  let reground;
  let velocityDev;
  let durationDev;
  const resetSimulator = () => {
    repetitions = 5;
    simBpm = bpm;
    late = 0;
    drop = 0;
    add = 0;
    wobble = 0;
    tempoFactor = 1;
    acceleration = 0;
    reground = 0;
    velocityDev = 0;
    durationDev = 0;
  };

  $: {
    if (exerciseNotes?.length) {
      notes = simulate({
        repetitions,
        simBpm,
        late,
        drop,
        add,
        wobble,
        tempoFactor,
        acceleration,
        reground,
        velocityDev,
        durationDev,
      });
    }
  }

  onMount(resetSimulator);

  const simulate = (options) => {
    const exerciseDuration = beats * Utils.bpmToSecondsPerBeat(bpm);
    const simNotes = [];
    const randStart = randomNormal(0, wobble);
    const randVelo = randomNormal(0.5, velocityDev);
    const randDur = randomNormal(0, durationDev);
    // const rand = normal.factory({
    //   seed: 12345,
    // });

    let timeOfLastReground = 0;
    for (let rep = 0; rep < repetitions; rep++) {
      for (const [index, note] of exerciseNotes.entries()) {
        // dropped note?
        if (drop > 0 && Math.random() <= drop) {
          continue;
        }
        // this would be perfect
        let start = note.start + rep * exerciseDuration;
        const currentBeat = start / spb;
        if (reground > 0 && currentBeat % reground === 0) {
          // reground to click
          timeOfLastReground = start;
        } else {
          // wrong tempo?
          const currentTempoFactor =
            1 / tempoFactor + (start - timeOfLastReground) * acceleration;
          // start *= currentTempoFactor;
          start =
            timeOfLastReground +
            (start - timeOfLastReground) * currentTempoFactor;
        }
        // consistently too late?
        start += late;
        // wobble
        start += randStart();
        const end = start + note.duration * randDur();
        simNotes.push({
          ...note,
          start,
          end,
          duration: end - start,
          velocity: randVelo(),
        });
        if (add > 0 && Math.random() <= add) {
          const start2 = start + randomNormal(0, 0.05)();
          simNotes.push({
            ...note,
            start: start2,
            end: start2 + note.duration,
          });
        }
      }
    }
    return simNotes.sort((a, b) => a.start - b.start);
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

  <SheetMusic {exercise} {exerciseXml} showDownloadButton="{false}" />
  <ExerciseAudio {exercise} {bpm} />

  <div class="simSettings">
    Simulator settings:
    <label title="the number of exercise repetitions">
      repetitions
      <input type="number" bind:value="{repetitions}" min="{1}" step="{1}" />
    </label>
    <label title="the intended tempo (beats per minute)">
      bpm
      <input type="number" bind:value="{simBpm}" min="{30}" step="{1}" />
    </label>
    <label title="constant latency added to each note (seconds)">
      late
      <input type="number" bind:value="{late}" step="{0.01}" />
    </label>
    <label title="probability for each note to be missed in [0, 1]">
      drop
      <input
        type="number"
        bind:value="{drop}"
        step="{0.01}"
        min="{0}"
        max="{1}"
      />
    </label>
    <label title="probability for each note to be doubled in [0, 1]">
      add
      <input
        type="number"
        bind:value="{add}"
        step="{0.01}"
        min="{0}"
        max="{1}"
      />
    </label>
    <label
      title="normally distributed random error for each note (parameter controls standard deviation in seconds)"
    >
      wobble
      <input
        type="number"
        bind:value="{wobble}"
        step="{0.01}"
        min="{0}"
        max="{0.5}"
      />
    </label>
    <label title="the actually played tempo will be bpm*factor">
      tempo factor
      <input type="number" bind:value="{tempoFactor}" step="{0.01}" />
    </label>
    <label title="the rate of increasing tempo">
      acceleration
      <input
        type="number"
        bind:value="{acceleration}"
        step="{0.001}"
        style="width:55px"
      />
    </label>
    <label
      title="number of beats between metronome clicks, where the player resets to the correct timing, before drifting off again"
    >
      reground
      <input type="number" bind:value="{reground}" min="1" step="{1}" />
    </label>
    <label
      title="normally distributed error, added to a velocity of 0.5 (parameter controls standard deviation)"
    >
      velocity
      <input
        type="number"
        bind:value="{velocityDev}"
        min="0"
        max="{1}"
        step="{0.01}"
      />
    </label>
    <label
      title="normally distributed error, multiplied with the expected duration (parameter controls standard deviation)"
    >
      duration
      <input
        type="number"
        bind:value="{durationDev}"
        min="0"
        max="{5}"
        step="{0.01}"
      />
    </label>
    <button on:click="{resetSimulator}">reset</button>
  </div>

  <MultiSelect options="{views}" bind:values="{currentViews}" label="Views:" />

  {#if currentViews.has('Filter')}
    <Filter {unfilteredNotes} bind:notes />
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

  <AudioPlayer2
    {width}
    {audio}
    bind:currentTimeInBeats
    {timeAlignment}
    {selectionEndTime}
    {spb}
  />

  {#if exercise !== ''}
    {#if currentViews.has('Histogram')}
      <HistogramPlot
        {width}
        values="{onsetsInBeats}"
        {beats}
        {contextBeats}
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Ticks')}
      <TickPlot
        {width}
        values="{onsetsInBeats}"
        {beats}
        {contextBeats}
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Density')}
      <DensityPlot
        {width}
        values="{onsetsInBeats}"
        {beats}
        {contextBeats}
        xLabel="beats"
      />
    {/if}
    {#if currentViews.has('Ground truth')}
      <GroundTruthPlot
        {width}
        notes="{exerciseNotes}"
        onsetsInBeats="{exerciseNoteOnsetsInBeats}"
        {beats}
        {contextBeats}
        {noteColorMode}
        {xTicks}
        currentTimeInBeats="{currentTimeInBeats % beats}"
      />
    {/if}
    {#if currentViews.has('Main')}
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
        bind:selectionStartTime
        bind:selectionEndTime
      />
    {/if}

    {#if currentViews.has('Note Distance')}
      <NoteDistanceBars
        {width}
        height="{300}"
        {notes}
        {onsetsInBeats}
        {noteColorMode}
        bind:currentTimeInBeats
        bind:selectionStartTime
        bind:selectionEndTime
      />
    {/if}

    {#if currentViews.has('Scatterplot')}
      <ScatterPlot
        {width}
        {notes}
        {onsetsInBeats}
        {exerciseNoteOnsetsInBeats}
        {beats}
        {noteColorMode}
        thicknessMode="{noteThicknessMode}"
        {xTicks}
        bind:currentTimeInBeats
        bind:selectionStartTime
        bind:selectionEndTime
      />
    {/if}

    {#if currentViews.has('Aggregated')}
      <AggregatedPlot
        {onsetsInBeats}
        {beats}
        {width}
        {xTicks}
        {exerciseNoteOnsetsInBeats}
      />
    {/if}

    {#if currentViews.has('Density Separate')}
      <DensityPlotSeparate
        {width}
        {notes}
        {onsetsInBeats}
        {beats}
        {xTicks}
        {exerciseNoteOnsetsInBeats}
      />
    {/if}

    {#if currentViews.has('Time diff.')}
      <DeltaTimeHistogramPlot {width} {onsetsInBeats} />
    {/if}

    {#if currentViews.has('Durations')}
      <NoteDurationHistogramPlot {width} {notes} />
    {/if}

    <!-- {#if currentViews.has('Piano roll')}
      <PianoRoll
        notes="{notes}"
        metronomeClicks="{metroClicks}"
        metronomeAccents="{metroAccents}"
        width="{width}"
      />
    {/if} -->

    {#if currentViews.has('Tempo Estimation')}
      <TempoEstimation
        {notes}
        {bpm}
        xLabel="estimated BPM"
        bandwidth="{0.5}"
        {width}
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

  .simSettings {
    background-color: rgba(70, 131, 180, 0.224);
    border-radius: 5px;
    padding: 10px;
  }
  .simSettings input[type='number'] {
    width: 45px;
  }
</style>
