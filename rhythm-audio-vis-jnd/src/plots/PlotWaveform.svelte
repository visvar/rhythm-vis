<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { fetchAudio, simulate } from '../lib/lib';

  export let pattern;
  export let audioFile;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  // load audio sample to use for notes
  let audioSample = null;
  let sampleRate;
  const getSample = async (audioFile) => {
    audioSample = await fetchAudio(audioFile);
    console.log(`Loaded ${audioFile}, sr= ${audioSample.sampleRate}`);
    sampleRate = audioSample.sampleRate;
  };
  $: getSample(audioFile);

  // render audio data for pattern using sample
  let audioData = null;
  const renderAndLoadAudio = (pattern, audioSample) => {
    if (audioSample) {
      audioData = simulate(audioSample, pattern);
    }
  };
  $: renderAndLoadAudio(pattern, audioSample);

  afterUpdate(() => {
    plotContainer.textContent = '';
    if (!audioData) {
      return;
    }
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 50,
      x: {
        axis: false,
        label: 'time in seconds',
      },
      y: { axis: false },
      marks: [
        Plot.lineY(audioData, {
          x: (d, i) => i / sampleRate,
          y: (d) => d,
        }),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
