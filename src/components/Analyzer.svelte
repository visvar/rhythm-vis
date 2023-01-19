<script>
  import JSZip from 'jszip';
  import { Utils } from 'musicvis-lib';
  import WaveSurfer from 'wavesurfer.js';
  import { onDestroy, onMount } from 'svelte';
  import HistogramPlot from './HistogramPlot.svelte';
  import TickPlot from './TickPlot.svelte';
  import DeltaTimeHistogramPlot from './DeltaTimeHistogramPlot.svelte';
  import MainPlot from './MainPlot.svelte';
  import NoteDurationHistogramPlot from './NoteDurationHistogramPlot.svelte';

  export let dataDirectoryHandle = null;

  let width = window.innerWidth - 100;

  let fileInput;
  let files = [];
  let extracted;
  let notes = [];
  let onsets = [];
  let audio;

  let wavesurfer;

  // config
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
  $: currentAdjustedTime = currentPlayerTime - (notes[0]?.start ?? 0);
  $: currentTimeInBeats = currentAdjustedTime / spb;

  // Parse MusicXML into a MusicPiece
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      // TODO: reset everything
      return;
    } else if (file.name.endsWith('.zip')) {
      const compressed = await file.arrayBuffer();
      extracted = await JSZip.loadAsync(compressed);
      const allFiles = Object.keys(extracted.files);
      files = [
        ...new Set(allFiles.map((d) => d.substring(0, d.lastIndexOf('.')))),
      ];
    } else {
      alert('Invalid file');
      return;
    }
  };

  // extract selected file from zip and get data
  const handleFileSelect = async (selectedFile) => {
    console.log(selectedFile);
    if (selectedFile !== null) {
      // notes
      const json = await extracted.file(`${selectedFile}.json`).async('string');
      notes = JSON.parse(json).notes;
      // onsets
      const ons = notes.map((d) => d.start);
      const first = ons[0];
      onsets = ons.map((d) => d - first);
      // audio
      audio = await extracted.file(`${selectedFile}.webm`).async('blob');
      console.log(notes, audio);
      wavesurfer.loadBlob(audio);
    }
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

  onMount(() => {
    // display list of recordings to analyze

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

  <div>
    Choose a .zip file with files for audio, MIDI, and metronome clicks. Can
    contain multiple recordings.
  </div>
  <input
    type="file"
    accept=".zip"
    bind:this="{fileInput}"
    on:input="{handleFileInput}"
  />

  <label>
    Recording
    <select on:input="{(e) => handleFileSelect(e.target.value)}">
      <option value="" disabled selected>select a recording</option>
      {#each files as f}
        <option value="{f}">{f}</option>
      {/each}
    </select>
  </label>

  <DeltaTimeHistogramPlot width="{width}" deltas="{deltas}" />
  <NoteDurationHistogramPlot width="{width}" notes="{notes}" />

  <label>
    Tempo in BPM
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
    Beats per row
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
    Context beats
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
    Note color
    <select bind:value="{noteColorMode}">
      {#each ['none', 'chroma', 'channel', 'velocity', 'duration'] as value}
        <option value="{value}">{value}</option>
      {/each}
    </select>
  </label>

  <label>
    x axis ticks
    <select bind:value="{xTicks}">
      <option value="{1}">beats</option>
      <option value="{1 / 2}">half-beats</option>
      <option value="{1 / 3}">triplets</option>
      <option value="{1 / 4}">quarter-beats</option>
      <option value="{1 / 5}">quintuplets</option>
      <option value="{1 / 6}">sextuplets</option>
      <option value="{1 / 7}">septuplets</option>
      <option value="{1 / 8}">eighth-beats</option>
    </select>
  </label>

  <button
    on:click="{() => wavesurfer.playPause()}"
    disabled="{!audio}"
    title="You can also use the space key"
  >
    play/pause
  </button>

  <div id="waveform" style="width: {width}px"></div>
  <div>
    Current player time: {currentPlayerTime.toFixed(3)}<br />
    Current adjusted time: {currentAdjustedTime.toFixed(3)}<br />
    Current time in beats: {currentTimeInBeats.toFixed(3)}<br />
  </div>

  <HistogramPlot
    width="{width}"
    values="{onsetsInBeats}"
    beats="{beats}"
    contextBeats="{contextBeats}"
    xLabel="beats"
  />
  <TickPlot
    width="{width}"
    values="{onsetsInBeats}"
    beats="{beats}"
    contextBeats="{contextBeats}"
    xLabel="beats"
  />

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
</main>

<style>
  label {
    display: inline-block;
    margin: 0 10px;
  }

  #waveform {
    padding: 0;
  }
</style>
