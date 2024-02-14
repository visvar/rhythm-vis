<script>
  import { fetchAudio, simulateDrum } from './lib/lib.js';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import Audio from './Audio.svelte';
  import { Utils } from 'musicvis-lib';
  import { onMount } from 'svelte';

  const audioFiles = [
    './bass.mp3',
    './bass2.mp3',
    './snare.mp3',
    './snare2.mp3',
    './hihat.mp3',
  ];

  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  // inter-onset interval in seconds
  // let ioi = 0.5;
  // $: bpm = (1 / ioi) * 60;
  // // deviation in percent of the ioi
  // let percentDeviation = 5;
  // // deviation in seconds
  // $: deviationSeconds = (percentDeviation / 100) * ioi;

  // let noteCount = 6;
  // let wrongNoteIndex = 3;
  // let shiftFollowing = true;
  // let paddingStart = 0;

  // // generate rhythmic pattern
  // let pattern = [];
  // $: {
  //   pattern = generatePatternSimple(
  //     noteCount,
  //     ioi,
  //     wrongNoteIndex,
  //     deviationSeconds,
  //     shiftFollowing,
  //     paddingStart,
  //   );
  //   // data = simulate(instrument, pattern)
  //   console.log('generated pattern', pattern);
  // }

  let BPM = 120;
  // @ts-ignore
  let spb = Utils.bpmToSecondsPerBeat(BPM);

  let drumPattern = [
    {
      sample: './bass.mp3',
      beats: [1, 3],
    },
    {
      sample: './snare.mp3',
      beats: [2, 4],
    },
    {
      sample: './hihat.mp3',
      beats: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
    },
  ];
  const duration = 4 * spb;

  let renderedAudio = null;
  let sampleRate;
  let noteTimes = [];

  const createDrumPattern = async () => {
    drumPattern = await Promise.all(
      drumPattern.map(async (d) => {
        return {
          ...d,
          times: d.beats.map((b) => spb * (b - 1)),
          audioBuffer: await fetchAudio(d.sample),
        };
      }),
    );
    noteTimes = drumPattern
      .map((d) => d.times)
      .flat()
      .sort();

    sampleRate = drumPattern[0].audioBuffer.sampleRate;
    // console.log(drumPattern);

    // render audio
    renderedAudio = simulateDrum(drumPattern, duration, sampleRate);
    // console.log(renderedAudio);
  };

  onMount(createDrumPattern);
</script>

<main>
  <h2>Playground</h2>
  <!-- <p>
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
  </div> -->

  <div class="stimuli">
    <Audio audioData="{renderedAudio}" {sampleRate} />
    <PlotWaveform
      audioData="{renderedAudio}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotTick pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
    <PlotBar pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
    <PlotColor pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
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
