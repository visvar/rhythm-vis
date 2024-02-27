<script>
  import { onDestroy, onMount } from 'svelte';
  import { audioDataToAudioEl } from './lib/lib.js';

  export let audioData = null;
  export let sampleRate = null;
  export let currentTrialNumber = -1;

  // render audio data for pattern using sample
  let audioEl;
  const renderAndLoadAudio = (audioData) => {
    if (audioData && audioEl) {
      audioDataToAudioEl(audioData, sampleRate, audioEl);
    }
  };
  // auto play
  $: {
    if (currentTrialNumber > -1) {
      window.setTimeout(play, 250);
    }
  }

  $: renderAndLoadAudio(audioData);

  const play = () => {
    if (!audioEl) {
      return;
    }
    audioEl.currentTime = 0;
    audioEl.play();
  };

  const handleKeyUp = (evt) => {
    if (evt.key === 'p') {
      play();
    }
  };

  onMount(() => {
    document.querySelector('html').addEventListener('keyup', handleKeyUp);
    renderAndLoadAudio(audioData);
  });

  onDestroy(() => {
    document.querySelector('html').removeEventListener('keyup', handleKeyUp);
  });
</script>

<main>
  <audio bind:this="{audioEl}" controls="{false}"></audio>
  <button on:click="{play}">play audio (p)</button>
</main>
