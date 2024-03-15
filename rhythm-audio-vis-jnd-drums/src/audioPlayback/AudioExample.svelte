<script>
  import { onMount } from 'svelte';
  import { audioDataToAudioEl, simulate } from '../lib/lib.js';

  export let pattern;
  export let cachedAudio = null;
  export let label = 'play audio';

  // render audio data for pattern using sample
  let audioData = null;
  let audioEl;
  const renderAndLoadAudio = (pattern, cachedAudio) => {
    if (cachedAudio && audioEl) {
      audioData = simulate(cachedAudio, pattern);
      audioDataToAudioEl(audioData, cachedAudio.sampleRate, audioEl);
    }
  };

  onMount(() => renderAndLoadAudio(pattern, cachedAudio));

  const play = async () => {
    if (!audioEl) {
      return;
    }
    audioEl.currentTime = 0;
    audioEl.play();
  };
</script>

<main>
  <audio bind:this="{audioEl}" controls="{false}"></audio>
  <button on:click="{play}">{label}</button>
</main>
