<script>
  import { onMount } from 'svelte';
  import WaveSurfer from 'wavesurfer.js';

  export let width = 800;
  export let blob;
  export let height = 50;

  let wavesurfer;
  onMount(() => {
    // https://wavesurfer-js.org/docs/options.html
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: 'gray',
      progressColor: 'steelblue',
      height,
      responsive: true,
    });
  });

  const updateBlob = async () => {
    wavesurfer.empty();
    wavesurfer.loadBlob(blob);
  };
  $: if (wavesurfer && blob) {
    updateBlob();
  }

  let playing = false;
  let volume = 0.5;

  $: if (wavesurfer && volume >= 0) {
    wavesurfer.setVolume(volume);
  }
</script>

<main>
  {#if blob}
    <div>
      <button
        on:click="{() => {
          playing = !playing;
          wavesurfer.playPause();
        }}"
      >
        {playing ? 'pause' : 'play'}
      </button>
    </div>
  {/if}
  <div id="waveform" width="{width}px"></div>
</main>

<style>
</style>
