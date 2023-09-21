<script>
  import { audioDataToAudioEl, generatePatternSimple, simulate } from './lib';
  import AudioDecode from 'audio-decode';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';

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

  // load audio sample to use for notes
  let audioSample = null;
  const audioFile = './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3';
  const fetchAudio = async () => {
    const res = await fetch(audioFile);
    const buffer = await res.arrayBuffer();
    audioSample = await AudioDecode(buffer);
    console.log(`Loaded ${audioFile}, sr= ${audioSample.sampleRate}`);
  };
  fetchAudio();

  // render audio data for pattern using sample
  let audioData = null;
  let audioEl;
  const renderAndLoadAudio = (pattern, audioSample) => {
    if (audioSample && audioEl) {
      audioData = simulate(audioSample, pattern);
      audioDataToAudioEl(audioData, audioSample.sampleRate, audioEl);
      console.log('rendered audio and attached to element');
    }
  };
  $: renderAndLoadAudio(pattern, audioSample);

  const play = () => {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.play();
  };
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
  </div>

  <div class="stimuli">
    <div>
      <audio bind:this="{audioEl}" controls="{false}"></audio>
      <button on:click="{play}">play audio</button>
    </div>
    <PlotTick pattern="{pattern}" />
    <PlotBar pattern="{pattern}" />
    <PlotColor pattern="{pattern}" />
    {#if audioSample}
      <PlotWaveform
        audioData="{audioData}"
        sampleRate="{audioSample.sampleRate}"
      />
    {/if}
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
