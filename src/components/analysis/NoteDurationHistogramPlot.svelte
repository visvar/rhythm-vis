<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let notes;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  const tickStyle = {
    stroke: 'white',
    opacity: 0.05,
    strokeWidth: 2,
  };

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 100,
      x: { label: 'Note duration (s)', labelPosition: 'center' },
      y: { label: 'Frequency', grid: true },
      marks: [
        Plot.rectY(
          notes.map((d) => d.end - d.start),
          Plot.binX(
            { y: 'count', thresholds: 100 },
            { x: (d) => d, fill: '#aaa' }
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
