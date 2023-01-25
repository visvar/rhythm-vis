<script>
  import { onDestroy, onMount } from 'svelte';
  import createAudioMeter from '../../lib/volume-meter-main/volume-meter.js';

  let audioContext = null;
  let meter = null;
  let canvas;
  let canvasContext = null;
  let width = 250;
  let height = 25;
  let rafID = null;
  let mediaStreamSource = null;

  onMount(() => {
    canvasContext = canvas.getContext('2d');
    startMeter();
  });

  const startMeter = () => {
    // grab an audio context
    audioContext = new AudioContext();
    // Attempt to get audio input
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Create an AudioNode from the stream.
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        // Create a new volume meter and connect it.
        meter = createAudioMeter(audioContext);
        mediaStreamSource.connect(meter);
        drawLoop();
      })
      .catch((err) => {
        // always check for errors at the end.
        console.error(`${err.name}: ${err.message}`);
        alert('Audio stream generation failed.');
      });
  };

  const drawLoop = () => {
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = meter.checkClipping() ? 'crimson' : 'green';
    canvasContext.fillRect(0, 0, meter.volume * width * 1.4, height);
    rafID = window.requestAnimationFrame(drawLoop);
  };

  const stopMeter = () => {
    window.cancelAnimationFrame(rafID);
    meter?.shutdown();
    meter = null;
    canvasContext?.clearRect(0, 0, width, height);
  };

  onDestroy(stopMeter);
</script>

<main>
  <h3>Audio Volume</h3>
  {#if !meter}
    <button on:click="{startMeter}"> turn on volume meter </button>
  {/if}
  <canvas bind:this="{canvas}" width="{width}px" height="{height}px"></canvas>
</main>

<style>
  canvas {
    border: 2px solid #888;
    border-radius: 5px;
  }

  main {
    text-align: center;
  }
</style>
