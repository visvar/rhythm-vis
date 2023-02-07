<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let values;
  export let xLabel = 'beats';
  export let beats;
  export let contextBeats = 0;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  const tickStyle = {
    stroke: 'black',
    opacity: 0.05,
    strokeWidth: 2,
  };

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 40,
      marginTop: 0,
      marginLeft: 45,
      marginBottom: 20,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: xLabel },
      y: { label: 'row' },
      marks: [
        Plot.tickX(values, {
          x: (d) => d % beats,
          ...tickStyle,
        }),
        // Context on the right
        Plot.tickX(
          values.filter(
            (d) => Math.floor(d / beats) > 0 && d % beats < contextBeats
          ),
          {
            x: (d) => (d % beats) + beats,
            ...tickStyle,
          }
        ),
        // Context on the left
        Plot.tickX(
          values.filter((d) => d % beats > beats - contextBeats),
          {
            x: (d) => (d % beats) - beats,
            ...tickStyle,
          }
        ),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
