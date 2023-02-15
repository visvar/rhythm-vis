<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let values;
  export let xLabel = 'beats';
  export let beats;
  export let contextBeats = 0;
  export let width = 800;
  export let height = 50;
  export let binsPerBeat = 20;

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 50,
      marginTop: 0,
      marginBottom: 30,
      style: {
        background: 'none',
        // color: 'white',
      },
      grid: true,
      x: { label: xLabel, domain: [-contextBeats, beats + contextBeats] },
      y: { label: 'frequency' },
      marks: [
        Plot.rectY(
          values,
          Plot.binX(
            { y: 'count', thresholds: binsPerBeat * beats },
            { x: (d) => d % beats, fill: 'black' }
          )
        ),
        // Context on the right
        Plot.rectY(
          values.filter(
            (d) => Math.floor(d / beats) > 0 && d % beats < contextBeats
          ),
          Plot.binX(
            { y: 'count', thresholds: binsPerBeat * contextBeats },
            { x: (d) => (d % beats) + beats, fill: '#ccc' }
          )
        ),
        // Context on the left
        Plot.rectY(
          values.filter((d) => d % beats > beats - contextBeats),
          Plot.binX(
            { y: 'count', thresholds: binsPerBeat * contextBeats },
            { x: (d) => (d % beats) - beats, fill: '#ccc' }
          )
        ),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
