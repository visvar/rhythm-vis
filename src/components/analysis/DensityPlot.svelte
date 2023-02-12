<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import * as kde from 'fast-kde';

  export let values;
  export let xLabel = 'beats';
  export let beats;
  export let contextBeats = 0;
  export let width = 800;
  export let height = 50;

  export let bandwidth = 0.05;
  export let pad = 4;
  export let bins = 512;

  let plotContainer;

  $: density1d = kde.density1d(
    values.map((d) => d % beats),
    { bandwidth, pad, bins }
  );

  afterUpdate(() => {
    const plot = Plot.plot({
      width,
      height: 50,
      marginTop: 0,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: xLabel, domain: [-contextBeats, beats + contextBeats] },
      y: { label: 'frequency' },
      marks: [
        // use bandwidth method to update efficiently without re-binning
        Plot.areaY(density1d.bandwidth(bandwidth), {
          x: 'x',
          y: 'y',
          fill: '#ccc',
        }),
        // Plot.ruleY([0]),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
