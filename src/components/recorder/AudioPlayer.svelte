<script>
  import { Utils } from 'musicvis-lib';
  import { onDestroy, onMount } from 'svelte';
  import WaveSurfer from 'wavesurfer.js';

  export let width = 800;
  export let blob;
  export let volume = 0.5;
  export let height = 50;
  export let pcm = [];

  let wavesurfer;
  onMount(() => {
    // https://wavesurfer-js.org/docs/options.html
    wavesurfer = WaveSurfer.create({
      container: '#waveform-player',
      waveColor: 'gray',
      progressColor: 'steelblue',
      width,
      height,
      responsive: true,
    });
  });

  const updateBlob = async () => {
    wavesurfer.empty();
    await wavesurfer.loadBlob(blob);
    // Allow other code to access PCM (amplitude at every frame)
    await Utils.delay(1);
    pcm = await wavesurfer.exportPCM(1024, 1000, true);
  };

  $: if (wavesurfer && blob) {
    updateBlob();
  }

  $: if (wavesurfer && !blob) {
    wavesurfer.empty();
    pcm = [];
  }

  $: if (wavesurfer && volume >= 0) {
    wavesurfer.setVolume(volume);
  }

  onDestroy(() => {
    wavesurfer.destroy();
  });
</script>

<main>
  {#if blob}
    <div>
      <button on:click="{() => wavesurfer.playPause()}"> play/pause </button>
    </div>
  {/if}
  <div id="waveform-player" width="{width}px"></div>
</main>

<style>
  main,
  div {
    padding: 0;
  }
</style>
