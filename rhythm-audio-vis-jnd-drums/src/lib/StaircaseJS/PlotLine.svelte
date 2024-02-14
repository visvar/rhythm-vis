<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let data = [];
  export let final = 0;
  export let width = 800;
  export let height = 150;
  export let showAbsolute = false;

  let plotContainer;

  afterUpdate(() => {
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 50,
      x: {
        axis: true,
        label: 'step',
      },
      y: { axis: true },
      marks: [
        Plot.lineY(showAbsolute ? data.map((d) => Math.abs(d)) : data, {
          x: (d, i) => i,
          y: (d) => d,
        }),
        Plot.ruleY([final], { stroke: 'red', strokeDasharray: '2 3' }),
        Plot.ruleY([0]),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
