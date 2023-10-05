<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let pattern;
  export let width = 800;
  export let height = 100;

  let plotContainer;

  afterUpdate(() => {
    const deltas = pattern.map((d, i) => (i === 0 ? 0 : d - pattern[i - 1]));
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 50,
      x: { axis: false },
      y: { axis: false },
      color: {
        scheme: 'Greys',
      },
      marks: [
        Plot.cell(deltas, {
          x: (d, i) => i,
          fill: (d) => d,
        }),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
