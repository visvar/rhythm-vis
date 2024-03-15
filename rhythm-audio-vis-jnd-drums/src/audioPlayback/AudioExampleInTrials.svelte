<script>
  import { onMount } from 'svelte';
  import { audioDataToAudioEl } from '../lib/lib.js';

  export let audioData = null;
  export let sampleRate = null;

  let audioEl;
  const renderAndLoadAudio = (audioData) => {
    if (audioData && audioEl) {
      audioDataToAudioEl(audioData, sampleRate, audioEl);
    }
  };

  onMount(() => renderAndLoadAudio(audioData));
  $: renderAndLoadAudio(audioData);

  const play = () => {
    if (!audioEl) {
      return;
    }
    audioEl.currentTime = 0;
    audioEl.play();
  };
</script>

<main>
  <audio bind:this="{audioEl}" controls="{false}"></audio>
  <button on:click="{play}">play audio</button>
</main>
