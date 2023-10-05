<script>
  import { audioDataToAudioEl, fetchAudio, simulate } from './lib/lib.js';

  export let pattern;
  export let audioFile;

  // load audio sample to use for notes
  let audioSample = null;
  const getSample = async (audioFile) => {
    audioSample = await fetchAudio(audioFile);
    console.log(`Loaded ${audioFile}, sr= ${audioSample.sampleRate}`);
  };
  $: getSample(audioFile);

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
  <audio bind:this="{audioEl}" controls="{false}"></audio>
  <button on:click="{play}">play audio</button>
</main>
