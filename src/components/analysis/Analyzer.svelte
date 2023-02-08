<script>
  import { MusicPiece, Utils } from 'musicvis-lib';
  import WaveSurfer from 'wavesurfer.js';
  import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
  import { onDestroy, onMount } from 'svelte';
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
  import MultiSelect from '../common/MultiSelect.svelte';
  import GroundTruthPlot from './GroundTruthPlot.svelte';

  export let dataDirectoryHandle = null;

  // views etc
  let width = window.innerWidth - 100;
  let wavesurfer;
  let views = [
    'Exercise',
    'Time diff.',
    'Durations',
    'Piano roll',
    'Ground truth',
    'Histogram',
    'Ticks',
    'Main',
    'Aggregated',
  ];
  let currentViews = new Set([
    'Exercise',
    'Waveform',
    'Ground truth',
    'Histogram',
    'Main',
    'Aggregated',
  ]);

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
  // let noteOpacityMode = 'none';
  let xTicks = 1;
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
  $: spb = Utils.bpmToSecondsPerBeat(bpm);

  // player etc
  let currentPlayerTime = 0;
  // adjust for delayed recording start by shifting notes
  let timeAlignment = 0;
  $: currentAdjustedTime = currentPlayerTime + timeAlignment;
  $: currentTimeInBeats = currentAdjustedTime / spb;
  let selectionEndTime = null;
  $: {
    setRegion(selectionEndTime);
  }
  const setRegion = (selectionEndTime) => {
    if (wavesurfer) {
      wavesurfer.clearRegions();
      if (selectionEndTime !== null) {
        wavesurfer.addRegion({
          start: currentPlayerTime,
          end: selectionEndTime,
          loop: true,
          drag: false,
          resize: false,
        });
      }
    }
  };

  $: {
    if (wavesurfer) {
      // when interacting with visualization, jump to same place in audio
      const time = currentTimeInBeats * spb;
      const duration = wavesurfer.getDuration();
      if (duration > 0 && !wavesurfer.isPlaying()) {
        const position = time / duration;
        // console.log(currentTimeInBeats, time, duration, position);
        try {
          wavesurfer.seekTo(position);
        } catch (e) {
          console.warn(e);
          console.log(
            `Wavesurfer cannot seek to ${position}, for time ${time} and duration ${duration}`
          );
        }
      }
    }
  }

  // data
  let recordings = new Map();
  let sortBy = 'date';
  let filterBy = '';
  let currentRecName;
  let notes = [];
  let metroClicks = [];
  let metroAccents = [];
  let audio = null;
  $: onsets = notes.map((d) => d.start - timeAlignment);
  $: onsetsInBeats = onsets.map((d) => d / spb);
  $: deltas = onsets.slice(1).map((d, i) => d - onsets[i]);

  // extract selected file from zip and get data
  const handleFileSelect = async (recName) => {
    console.log(recName);
    currentRecName = null;
    notes = [];
    metroClicks = [];
    metroAccents = [];
    audio = null;
    wavesurfer.empty();
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
    console.log({ notes, metroClicks, metroAccents, audio });
    // read exercise parameters from file name
    currentRecName = recName;
    const fileName = files[0].name.substring(0, files[0].name.indexOf('.'));
    const [ins, exc, rhy, tem, clk, per, dat] = fileName.split('_');
    exercise = [ins, exc, rhy].join('_');
    bpm = +tem.replace('-bpm', '');
    console.log(exercise, bpm);
    // timeAlignment = Utils.roundToNDecimals(notes[0]?.start ?? 0, 2);
    timeAlignment = 0;
    try {
      wavesurfer.loadBlob(audio);
    } catch (e) {
      console.error(e);
    }
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

  const playPauseOnSpaceBar = (e) => {
    if (e.key === ' ' && wavesurfer) {
      wavesurfer.playPause();
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

  const setupWavesurfer = () => {
    // set up wavesurfer
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#bbb',
      progressColor: 'steelblue',
      mediaControls: true,
      normalize: true,
      width: width - 20,
      height: 40,
      plugins: [RegionsPlugin.create({})],
    });
    wavesurfer.on('audioprocess', (time) => {
      currentPlayerTime = Utils.roundToNDecimals(time, 2);
    });
    // React to interaction (brush-link)
    wavesurfer.on('interaction', () => {
      const time = wavesurfer.getCurrentTime();
      currentPlayerTime = time;
    });
  };

  onMount(() => {
    updateRecordingList();
    setupWavesurfer();
    // play and pause with spacebar
    document.body.addEventListener('keydown', playPauseOnSpaceBar);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', playPauseOnSpaceBar);
    wavesurfer.destroy();
  });

  /**
   * Sorts recordings for the select options
   * @param {string[]} recordingNames recording names
   * @param {string} by sorty by...
   */
  const sortRecs = (recordingNames, by) => {
    // const [ins, exc, rhy, tem, clk, per, dat] = fileName.split('_');
    if (by === 'name') {
      recordingNames.sort();
    } else if (by === 'date') {
      recordingNames.sort((a, b) =>
        a.split('_')[6] < b.split('_')[6] ? 1 : -1
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
  {#if currentViews.has('Time diff.')}
    <DeltaTimeHistogramPlot width="{width}" deltas="{deltas}" />
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

  <!-- <label>
    time alignment
    <input
      bind:value="{timeAlignment}"
      type="number"
      min="-10"
      max="10"
      step="0.01"
      style="width: 60px"
    />
  </label> -->

  <select
    bind:value="{midiSource}"
    on:change="{() => handleFileSelect(currentRecName)}"
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
      max="32"
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
      {#each ['none', 'chroma', 'pitch', 'channel', 'velocity', 'duration'] as value}
        <option value="{value}">{value}</option>
      {/each}
    </select>
  </label>

  <!-- <label title="Note opacity mode">
    opacity
    <select bind:value="{noteOpacityMode}">
      {#each ['none', 'velocity', 'duration'] as value}
        <option value="{value}">{value}</option>
      {/each}
    </select>
  </label> -->

  <label>
    x axis ticks
    <select bind:value="{xTicks}">
      <option value="{1 / 1}">beats</option>
      <option value="{1 / 2}">half-beats</option>
      <option value="{1 / 3}">triplets</option>
      <option value="{1 / 4}">quarter-beats</option>
      <option value="{1 / 5}">quintuplets</option>
      <option value="{1 / 6}">sextuplets</option>
      <option value="{1 / 7}">septuplets</option>
      <option value="{1 / 8}">eighth-beats</option>
      <option value="exercise">exercise</option>
    </select>
  </label>

  <!-- audio player -->
  <div class="player">
    <div id="waveform" style="width: {width}px"></div>
    <div class="time-display">
      <button
        on:click="{() => wavesurfer.playPause()}"
        disabled="{!audio}"
        title="You can also use the space key"
      >
        play/pause
      </button>
      <label title="Playback rate, e.g., 1 for normal, 0.5 for half speed">
        speed
        <input
          on:input="{(e) => wavesurfer.setPlaybackRate(+e.target.value)}"
          type="number"
          value="1"
          min="0.1"
          max="2"
          step="0.1"
          style="width: 50px"
        />
      </label>
      <span>time in seconds: {currentPlayerTime.toFixed(3)}</span>
      <!-- <span>adjusted time: {currentAdjustedTime.toFixed(3)}</span> -->
      <span>time in beats: {currentTimeInBeats.toFixed(3)}</span>
    </div>
  </div>

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
  {#if currentViews.has('Ground truth')}
    <GroundTruthPlot
      width="{width}"
      notes="{exerciseNotes}"
      onsetsInBeats="{exerciseNoteOnsetsInBeats}"
      beats="{beats}"
      contextBeats="{contextBeats}"
      colorMode="{noteColorMode}"
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
      colorMode="{noteColorMode}"
      xTicks="{xTicks}"
      bind:currentTimeInBeats="{currentTimeInBeats}"
      bind:selectionEndTime="{selectionEndTime}"
    />
  {/if}

  {#if currentViews.has('Aggregated')}
    <AggregatedPlot
      onsetsInBeats="{onsetsInBeats}"
      beats="{beats}"
      width="{width}"
    />
  {/if}

  <button on:click="{deleteCurrentRecording}" disabled="{!currentRecName}">
    delete current recording
  </button>
</main>

<style>
  label {
    display: inline-block;
    margin: 0 10px;
  }

  .player {
    margin: 2px 5px;
    padding: 10px 25px 0 25px;
    background: #f8f8f8;
    border-radius: 5px;
  }

  #waveform {
    padding: 0;
  }

  .time-display {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    justify-items: center;
    align-items: center;
  }
</style>
