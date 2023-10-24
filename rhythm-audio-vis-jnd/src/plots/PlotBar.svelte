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
      marginLeft: 0,
      marginRight: 1,
      // x: { axis: false },
      y: { axis: false },
      marks: [
        Plot.barY(deltas, { x: (d, i) => i + 1, y: (d) => d }),
        // Plot.frame(),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main style="width: {width}px; margin: auto">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <div>
    For each note but the first, the bars' height shows the distance to the
    previous note. A smaller bar indicates an early note.
  </div>
</main>
