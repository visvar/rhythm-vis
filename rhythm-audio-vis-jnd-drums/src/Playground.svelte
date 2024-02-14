<script>
  import { generatePatternSimple } from './lib/lib.js';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import Audio from './Audio.svelte';

  const audioFiles = [
    './bass.mp3',
    './bass2.mp3',
    './snare.mp3',
    './snare2.mp3',
    './hihat.mp3',
  ];
  let audioFile = audioFiles[0];

  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  // inter-onset interval in seconds
  let ioi = 0.5;
  $: bpm = (1 / ioi) * 60;
  // deviation in percent of the ioi
  let percentDeviation = 5;
  // deviation in seconds
  $: deviationSeconds = (percentDeviation / 100) * ioi;

  let noteCount = 6;
  let wrongNoteIndex = 3;
  let shiftFollowing = true;
  let paddingStart = 0;

  // generate rhythmic pattern
  let pattern = [];
  $: {
    pattern = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      deviationSeconds,
      shiftFollowing,
      paddingStart,
    );
    // data = simulate(instrument, pattern)
    console.log('generated pattern', pattern);
  }
</script>

<main>
  <h2>Playground</h2>
  <p>
    All stimuli (audio and visualizations) and configurable deviation. Play
    around with different values to compare how stimuli look and how small
    deviations can be
  </p>
  <div>
    inter-onset interval (IOI): {(ioi * 1000).toFixed(0)} milliseconds ({bpm} bpm)
    <label>
      deviation as percent of IOI
      <input
        type="range"
        bind:value="{percentDeviation}"
        min="-20"
        max="20"
        step="1"
      />
      {percentDeviation.toFixed(1)}
      ({(deviationSeconds * 1000).toFixed(1)} milliseconds)
    </label>
    <label>
      instrument sample:
      <select bind:value="{audioFile}">
        {#each audioFiles as af}
          <option value="{af}">{af.substring(0, 30)}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="stimuli">
    <Audio {pattern} {audioFile} />
    <PlotWaveform
      {pattern}
      {audioFile}
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotTick {pattern} width="{visWidth}" height="{visHeight}" />
    <PlotBar {pattern} width="{visWidth}" height="{visHeight}" />
    <PlotColor {pattern} width="{visWidth}" height="{visHeight}" />
  </div>
</main>

<style>
  label {
    display: block;
  }

  .stimuli {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    justify-items: center;
    align-items: center;
  }
</style>
