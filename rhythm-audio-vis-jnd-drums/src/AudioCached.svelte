<script>
  import { onMount } from 'svelte';
  import { audioDataToAudioEl, simulate } from './lib/lib.js';

  export let pattern;
  export let cachedAudio = null;
  export let currentTrialNumber = -1;

  // render audio data for pattern using sample
  let audioData = null;
  let audioEl;
  const renderAndLoadAudio = () => {
    if (cachedAudio && audioEl) {
      audioData = simulate(cachedAudio, pattern);
      audioDataToAudioEl(audioData, cachedAudio.sampleRate, audioEl);
    }
  };
  // auto play
  $: {
    if (currentTrialNumber > -1) {
      renderAndLoadAudio();
      window.setTimeout(play, 200);
    }
  }
  onMount(renderAndLoadAudio);

  const play = () => {
    if (!audioEl) {
      return;
    }
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
