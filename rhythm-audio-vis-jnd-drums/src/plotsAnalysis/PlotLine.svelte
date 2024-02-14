<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let title = undefined;
  export let width = 600;
  export let height = 200;
  export let data;
  export let x = 'x';
  export let y = 'y';

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      title,
      width,
      height,
      x: {
        domain: [0, 70],
      },
      marks: [
        Plot.line(data, {
          x,
          y,
          stroke: '#ccc',
        }),
        Plot.ruleY([0]),
      ],
    });
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
