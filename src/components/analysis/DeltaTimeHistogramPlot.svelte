<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let onsetsInBeats;
  export let width = 800;
  export let height = 50;

  $: deltas = onsetsInBeats.slice(1).map((d, i) => d - onsetsInBeats[i]);

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height: 100,
      style: {
        background: 'none',
      },
      x: { label: 'Time between following notes (in beats)' },
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

<main class="view">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
