<script>
  import { onMount } from 'svelte';
  import { audioDataToAudioEl, fetchAudio, simulate } from './lib/lib.js';

  export let pattern;
  export let audioFile;
  export let cachedAudio = null;
  export let currentTrialNumber = -1;

  // load audio sample to use for notes
  let audioSample = null;
  const getSample = async (audioFile) => {
    // use cached if available
    if (cachedAudio) {
      audioSample = cachedAudio;
      console.log('used cached audio');
    } else {
      audioSample = await fetchAudio(audioFile);
      console.log(`loaded ${audioFile}, sr= ${audioSample.sampleRate}`);
    }
  };
  $: getSample(audioFile);

  // render audio data for pattern using sample
  let audioData = null;
  let audioEl;
  const renderAndLoadAudio = (pattern, audioSample) => {
    if (audioSample && audioEl) {
      audioData = simulate(audioSample, pattern);
      audioDataToAudioEl(audioData, audioSample.sampleRate, audioEl);
      // console.log('rendered audio and attached to element');
    }
  };
  $: console.log(pattern);
  // auto play
  $: {
    if (currentTrialNumber > -1) {
      window.setTimeout(play, 200);
    }
  }

  $: renderAndLoadAudio(pattern, audioSample);

  const play = () => {
    if (!audioEl) {
      return;
    }
    // console.log('play');
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.play();
  };

  onMount(() => {
    document.querySelector('html').addEventListener('keyup', (evt) => {
      if (evt.key === 'p') {
        play();
      }
    });
  });
</script>

<main>
  <audio bind:this="{audioEl}" controls="{false}"></audio>
  <button on:click="{play}">play audio (p)</button>
</main>
