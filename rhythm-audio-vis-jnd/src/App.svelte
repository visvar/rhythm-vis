<script>
  import { Utils } from 'musicvis-lib';

  // inter-onset interval in seconds
  let ioi = 0.5;
  $: bpm = (1 / ioi) * 60;
  // deviation in percent of the ioi
  let percentDeviation = 5;
  // deviation in seconds
  $: deviationSeconds = (percentDeviation / 100) * ioi;
</script>

<main>
  <h1>Rhythm Error Perception Study</h1>
  <p>
    You will be presented with a sequence of six notes which should have equal
    distances. The fourth note might be played wrong (too early or too late) and
    this deviation sound good, ok, or wrong. Please rate based your subjective
    opinion! You can play the audio as many times as you like.
  </p>

  <div>
    IOI = {(ioi * 1000).toFixed(0)} milliseconds ({bpm} bpm)
    <label>
      deviation as percent of IOI
      <input
        type="range"
        bind:value="{percentDeviation}"
        min="0"
        max="5"
        step="0.1"
      />
      {percentDeviation.toFixed(1)}
      ({(deviationSeconds * 1000).toFixed(1)} milliseconds)
    </label>
    <label>
      deviation as percent of IOI
      <input type="range" bind:value="{ioi}" step="1" />
      {percentDeviation.toFixed(1)}
    </label>
  </div>
</main>

<style>
  label {
    display: block;
  }
</style>
