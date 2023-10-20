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

  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  // inter-onset interval in seconds
  let ioi = 0.5;
  // deviation in percent of the ioi
  let percentDeviation = 20;
  // deviation in seconds
  $: deviationSeconds = (percentDeviation / 100) * ioi;

  let noteCount = 6;
  let wrongNoteIndex = 3;
  let shiftFollowing = true;
  let paddingStart = 0;

  // generate rhythmic pattern
  let pattern1 = [];
  $: {
    pattern1 = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      -deviationSeconds,
      shiftFollowing,
      paddingStart
    );
  }
  let pattern2 = [];
  $: {
    pattern2 = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      deviationSeconds,
      shiftFollowing,
      paddingStart
    );
  }
</script>

<main>
  <h2>Examples</h2>
  <div>
    <label>
      deviation
      <input
        type="range"
        bind:value="{percentDeviation}"
        min="0"
        max="20"
        step="1"
      />
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
    <h2>early fourth note</h2>
    <h2>late fourth note</h2>
    <Audio pattern="{pattern1}" audioFile="{audioFile}" />
    <Audio pattern="{pattern2}" audioFile="{audioFile}" />
    <PlotWaveform
      pattern="{pattern1}"
      audioFile="{audioFile}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotWaveform
      pattern="{pattern2}"
      audioFile="{audioFile}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotTick pattern="{pattern1}" width="{visWidth}" height="{visHeight}" />
    <PlotTick pattern="{pattern2}" width="{visWidth}" height="{visHeight}" />
    <PlotBar pattern="{pattern1}" width="{visWidth}" height="{visHeight}" />
    <PlotBar pattern="{pattern2}" width="{visWidth}" height="{visHeight}" />
    <PlotColor pattern="{pattern1}" width="{visWidth}" height="{visHeight}" />
    <PlotColor pattern="{pattern2}" width="{visWidth}" height="{visHeight}" />
  </div>
</main>

<style>
  label {
    display: block;
  }

  .stimuli {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    column-gap: 50px;
    justify-items: center;
    align-items: center;
  }
</style>
