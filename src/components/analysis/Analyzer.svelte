<script>
  import { Utils } from 'musicvis-lib';
  import WaveSurfer from 'wavesurfer.js';
  import { onDestroy, onMount } from 'svelte';
  import HistogramPlot from './HistogramPlot.svelte';
  import TickPlot from './TickPlot.svelte';
  import DeltaTimeHistogramPlot from './DeltaTimeHistogramPlot.svelte';
  import MainPlot from './MainPlot.svelte';
  import NoteDurationHistogramPlot from './NoteDurationHistogramPlot.svelte';
  import { group } from 'd3';
  import SheetMusic from '../common/SheetMusic.svelte';
  import PianoRoll from '../common/PianoRoll.svelte';
  import { readJsonFile } from '../../lib/files';
  import MultiSelect from '../common/MultiSelect.svelte';

  export let dataDirectoryHandle = null;

  let width = window.innerWidth - 100;

  let recordings = new Map();
  let notes = [];
  let onsets = [];
  let metroClicks = [];
  let metroAccents = [];
  let audio = null;

  let wavesurfer;
  let views = [
    'Exercise',
    'Time diff.',
    'Durations',
    'Piano roll',
    // 'Waveform',
    'Histogram',
    'Ticks',
    'Main',
  ];
  let currentViews = new Set(['Exercise', 'Waveform', 'Histogram', 'Main']);

  // config
  let exercise;
  let bpm = 120;
  let beats = 4;
  let contextBeats = 1;
  let noteColorMode = 'none';
  let xTicks = 1;
  $: spb = Utils.bpmToSecondsPerBeat(bpm);
  $: onsetsInBeats = onsets.map((d) => d / spb);
  $: deltas = onsets.slice(1).map((d, i) => d - onsets[i]);

  // player etc
  let currentPlayerTime = 0;
  $: timeAlignment = 0;
  $: currentAdjustedTime = currentPlayerTime - timeAlignment;
  $: currentTimeInBeats = currentAdjustedTime / spb;

  // extract selected file from zip and get data
  const handleFileSelect = async (recName) => {
    console.log(recName);
    const files = recordings.get(recName);
    notes = [];
    onsets = [];
    metroClicks = [];
    metroAccents = [];
    audio = null;
    if (!files) {
      return;
    }
    for (const file of files) {
      if (file.name.endsWith('.rec.json')) {
        // notes
        notes = await readJsonFile(file.handle);
        // onsets
        try {
          const ons = notes.map((d) => d.start);
          const first = ons[0];
          onsets = ons.map((d) => d - first);
        } catch (e) {
          console.log('Cannot calculate onsets from notes', { notes });
        }
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
    wavesurfer.loadBlob(audio);
    // read exercise parameters from file name
    const fileName = files[0].name.substring(0, files[0].name.indexOf('.'));
    const [ins, exc, rhy, tem, clk, per, dat] = fileName.split('_');
    exercise = [ins, exc, rhy].join('_');
    bpm = +tem.replace('-bpm', '');
    timeAlignment = notes[0]?.start ?? 0;
  };

  const playPauseOnSpaceBar = (e) => {
    if (e.key === ' ') {
      wavesurfer.playPause();
    }
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
    });
    wavesurfer.on('audioprocess', (time) => {
      currentPlayerTime = Utils.roundToNDecimals(time, 2);
    });
    // React to interaction (brush-link)
    wavesurfer.on('interaction', () => {
      const time = wavesurfer.getCurrentTime();
      currentPlayerTime = time;
    });
    // Move time cursor to first note when audio loaded
    wavesurfer.on('ready', () => {
      const startTime = notes[0].start;
      const duration = wavesurfer.getDuration();
      wavesurfer.seekTo(startTime / duration);
      currentPlayerTime = startTime;
    });
  };

  onMount(async () => {
    // display list of recordings to analyze
    const files = [];
    for await (const [key, value] of dataDirectoryHandle.entries()) {
      files.push({ name: key, handle: value });
    }
    // group by recording name, to get all files that the belong to the same recording
    const grouped = group(files, (d) =>
      d.name.substring(0, d.name.indexOf('.'))
    );
    recordings = grouped;
    // wavesurfer
    setupWavesurfer();
    // play and pause with spacebar
    document.body.addEventListener('keydown', playPauseOnSpaceBar);
  });

  onDestroy(() => {
    document.removeEventListener('keydown', playPauseOnSpaceBar);
    wavesurfer.destroy();
  });
</script>

<main>
  <h2>Analysis</h2>

  <label>
    Recording:
    <select on:input="{(e) => handleFileSelect(e.target.value)}">
      <option value="" disabled selected>select a recording</option>
      {#each [...recordings.keys()] as recName}
        <option value="{recName}">{recName}</option>
      {/each}
    </select>
  </label>

  <MultiSelect options="{views}" bind:values="{currentViews}" label="Views:" />

  {#if currentViews.has('Exercise')}
    <SheetMusic exercise="{exercise}" showDownloadButton="{false}" />
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

  <label>
    time alignment
    <input
      bind:value="{timeAlignment}"
      type="number"
      min="-10"
      max="10"
      step="0.01"
      style="width: 50px"
    />
  </label>

  <label>
    tempo in BPM
    <input
      bind:value="{bpm}"
      type="number"
      min="1"
      max="500"
      step="1"
      style="width: 50px"
    />
  </label>

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
      min="1"
      max="8"
      step="1"
      style="width: 50px"
    />
  </label>

  <label>
    note color
    <select bind:value="{noteColorMode}">
      {#each ['none', 'chroma', 'channel', 'velocity', 'duration'] as value}
        <option value="{value}">{value}</option>
      {/each}
    </select>
  </label>

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
    </select>
  </label>

  <div id="waveform" style="width: {width}px"></div>

  <div class="time-display">
    <button
      on:click="{() => wavesurfer.playPause()}"
      disabled="{!audio}"
      title="You can also use the space key"
    >
      play/pause
    </button>
    <span>player time: {currentPlayerTime.toFixed(3)}</span>
    <span>adjusted time: {currentAdjustedTime.toFixed(3)}</span>
    <span>time in beats: {currentTimeInBeats.toFixed(3)}</span>
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
  {#if currentViews.has('Main')}
    <MainPlot
      width="{width}"
      notes="{notes}"
      onsets="{onsets}"
      onsetsInBeats="{onsetsInBeats}"
      beats="{beats}"
      contextBeats="{contextBeats}"
      colorMode="{noteColorMode}"
      xTicks="{xTicks}"
      currentTimeInBeats="{currentTimeInBeats}"
    />
  {/if}
</main>

<style>
  label {
    display: inline-block;
    margin: 0 10px;
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
