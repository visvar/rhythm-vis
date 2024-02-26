<script>
  import { onMount } from 'svelte';
  import { audioDataToAudioEl } from './lib/lib.js';

  export let audioData = null;
  export let sampleRate = null;
  export let currentTrialNumber = -1;

  // render audio data for pattern using sample
  let audioEl;
  const renderAndLoadAudio = (audioData) => {
    if (audioData && audioEl) {
      audioDataToAudioEl(audioData, sampleRate, audioEl);
      // console.log('rendered audio and attached to element');
    }
  };
  // auto play
  $: {
    if (currentTrialNumber > -1) {
      window.setTimeout(play, 200);
    }
  }

  $: renderAndLoadAudio(audioData);

  const play = () => {
    if (!audioEl) {
      return;
    }
    // console.log('play');
    // audioEl.pause();
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
