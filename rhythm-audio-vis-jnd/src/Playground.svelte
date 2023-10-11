<script>
  import { generatePatternSimple } from './lib/lib.js';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import Audio from './Audio.svelte';

  const audioFiles = [
    './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3',
    './MailboxBadgerPublicDomainDrumSamples27LiveDrumsHiHat.mp3',
  ];
  let audioFile = audioFiles[0];

  // inter-onset interval in seconds
  let ioi = 0.5;
  $: bpm = (1 / ioi) * 60;
  // deviation in percent of the ioi
  let percentDeviation = 5;
  // deviation in seconds
  $: deviationSeconds = (percentDeviation / 100) * ioi;

  let noteCount = 6;
  let wrongNoteIndex = 3;
  let paddingStart = 0;

  // generate rhythmic pattern
  let pattern = [];
  $: {
    pattern = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      deviationSeconds,
      paddingStart
    );
    // data = simulate(instrument, pattern)
    console.log('generated pattern', pattern);
  }
</script>

<main>
  <h2>Playground</h2>
  <p>All stimuli (audio and visualizations) and configurable deviation.</p>
  <div>
    IOI = {(ioi * 1000).toFixed(0)} milliseconds ({bpm} bpm)
    <label>
      deviation as percent of IOI
      <input
        type="range"
        bind:value="{percentDeviation}"
        min="-15"
        max="15"
        step="1"
      />
      {percentDeviation.toFixed(1)}
      ({(deviationSeconds * 1000).toFixed(1)} milliseconds)
    </label>
    <label>
      Sample:
      <select bind:value="{audioFile}">
        {#each audioFiles as af}
          <option value="{af}">{af.substring(0, 30)}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="stimuli">
    <Audio pattern="{pattern}" audioFile="{audioFile}" />
    <PlotWaveform pattern="{pattern}" audioFile="{audioFile}" height="{100}" />
    <PlotTick pattern="{pattern}" />
    <PlotBar pattern="{pattern}" />
    <PlotColor pattern="{pattern}" />
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
