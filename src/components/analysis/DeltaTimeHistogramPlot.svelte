<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let deltas;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 100,
      style: {
        background: 'none',
      },
      x: { label: 'Time between following notes (s)' },
      y: { label: 'Frequency', grid: true },
      marks: [
        Plot.rectY(
          deltas,
          Plot.binX(
            { y: 'count', thresholds: 200 },
            { x: (d) => d, fill: '#aaa', inset: 0 }
          )
        ),
        Plot.ruleX([0]),
        Plot.ruleY([0]),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
