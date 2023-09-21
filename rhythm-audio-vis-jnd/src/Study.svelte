<script>
  import { audioDataToAudioEl, generatePatternSimple, simulate } from './lib';
  import AudioDecode from 'audio-decode';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import PlotStudyResponses from './plots/PlotStudyResponses.svelte';

  // inter-onset interval in seconds
  let ioi = 0.5;
  // deviation in percent of the ioi
  let percentDeviation = 15;
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

  // study
  // see Figure 1 of https://www.speech.kth.se/~sofiad/pdf/SMAC03_DahlGranqvist.pdf
  // TODO: when to double step?
  // TODO: when to stop?
  const initialStep = 2;
  const minimumStep = 0.1;
  let currentStep = initialStep;
  let correctCount = 0;
  // e.g., when 2: after two correct responses, the deviation is reduced by one step value
  let requiredCorrect = 2;
  let tracking = [];
  const response = (res) => {
    // check if correct
    const correctRes = deviationSeconds < 0 ? 'early' : 'late';
    const correct = res === correctRes;
    let action;
    if (!correct && tracking.length > 0) {
      // go back one step
      action = 'step back';
      percentDeviation += currentStep;
      correctCount = 0;
    } else {
      correctCount++;
      if (correctCount < requiredCorrect) {
        action = 'wait for more correct';
      } else {
        correctCount = 0;
        action = 'step forward';
        // half step size after two steps forward one step back
        if (
          tracking.length > 2 &&
          tracking.at(-2).correct === false &&
          tracking.at(-1).correct === true
        ) {
          currentStep = Math.max(currentStep / 2, minimumStep);
        }
        // go one step further
        percentDeviation -= currentStep;
      }
    }

    // track response curve
    const entry = {
      deviationSeconds,
      percentDeviation,
      res,
      correct,
      action,
      currentStep,
    };
    tracking = [...tracking, entry];
    console.log(tracking);
  };
</script>

<main>
  <h2>Study</h2>
  <p>Does the audio/visualization show an error in the musician's timing?</p>
  <div class="response">
    <button on:click="{() => response('early')}">too early</button>
    <button on:click="{() => response('late')}">too late</button>
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

  <div class="study-tracking">
    <PlotStudyResponses tracking="{tracking}" />
  </div>
</main>

<style>
  .stimuli,
  .study-tracking {
    margin: 30px 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    justify-items: center;
    align-items: center;
  }
</style>
