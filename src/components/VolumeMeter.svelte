<script>
  import { onDestroy, onMount } from 'svelte';
  import createAudioMeter from '../lib/volume-meter-main/volume-meter.js';

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
        // kick off the visual updating
        drawLoop();
      })
      .catch((err) => {
        // always check for errors at the end.
        console.error(`${err.name}: ${err.message}`);
        alert('Stream generation failed.');
      });
  };

  const drawLoop = () => {
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.fillStyle = meter.checkClipping() ? 'red' : 'green';
    canvasContext.fillRect(0, 0, meter.volume * width * 1.4, height);
    rafID = window.requestAnimationFrame(drawLoop);
  };

  const stopMeter = () => {
    window.cancelAnimationFrame(rafID);
    meter?.shutdown();
    meter = null;
    canvasContext?.clearRect(0, 0, width, height);
  };

  const toggleMeter = () => {
    !meter ? startMeter() : stopMeter();
  };

  onDestroy(stopMeter);
</script>

<main>
  <h2>Audio Volume</h2>
  <div>
    <button on:click="{toggleMeter}">
      turn volume meter {!meter ? 'on' : 'off'}
    </button>
    <canvas bind:this="{canvas}" width="{width}px" height="{height}px"></canvas>
  </div>
</main>

<style>
  canvas {
    border: 1px solid #333;
    border-radius: 3px;
  }

  main {
    text-align: center;
  }

  div {
    width: 500px;
    margin: auto;
    display: grid;
    grid-template-columns: 250px 250px;
    gap: 20px;
    align-items: center;
  }
</style>
