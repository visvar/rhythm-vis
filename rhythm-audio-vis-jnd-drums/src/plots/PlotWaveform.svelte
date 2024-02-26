<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let audioData = [];
  export let sampleRate = 1;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    if (!audioData) {
      return;
    }
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 0,
      marginRight: 1,
      x: {
        axis: false,
        label: 'time in seconds',
      },
      y: { axis: false, domain: [-1, 1] },
      marks: [
        Plot.lineY(audioData, {
          x: (d, i) => i / sampleRate,
          y: (d) => d,
        }),
        // Plot.frame(),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main style="width: {width}px; margin: auto">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <!-- <div>
    The waveform of the audio showing the loudness over time time from left to
    right. Note onsets show up as peaks. A smaller gap between peaks indicates
    an early note.
  </div> -->
</main>
