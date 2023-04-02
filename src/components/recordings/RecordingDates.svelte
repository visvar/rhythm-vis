<script>
  import * as Plot from '@observablehq/plot';
  import { extent, utcWeek } from 'd3';
  import { afterUpdate } from 'svelte';

  export let dates;
  export let width = 800;
  export let height = 50;

  let plotContainer;

  afterUpdate(() => {
    // console.log(dates);
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 100,
      style: {
        background: 'none',
      },
      x: {
        label: 'Number of recordings over time',
        domain: extent(dates),
        nice: true,
      },
      y: { label: 'Count', grid: true, nice: true },
      marks: [
        Plot.rectY(
          dates,
          Plot.binX(
            { y: 'count', thresholds: utcWeek },
            { x: (d) => d, fill: '#aaa', inset: 1, rx: 2, clip: true }
          )
        ),
        Plot.ruleX([0]),
        Plot.ruleY([0]),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main class="view">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
