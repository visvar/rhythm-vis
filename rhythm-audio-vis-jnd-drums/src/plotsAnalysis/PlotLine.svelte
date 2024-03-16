<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let title = undefined;
  export let final = undefined;
  export let width = 600;
  export let height = 180;
  export let data;
  export let x = (d, i) => i;
  export let y = (d) => d;
  export let xDomain = [0, 70];

  let plotContainer;

  afterUpdate(() => {
    // console.log({ final });
    plotContainer.textContent = '';
    const plot = Plot.plot({
      title,
      width,
      height,
      x: {
        domain: xDomain,
      },
      marks: [
        Plot.line(data, {
          x,
          y,
          stroke: '#ccc',
        }),
        Plot.dot(data, {
          x,
          y,
          fill: '#aaa',
          r: 2,
          tip: true,
        }),
        Plot.ruleY([0]),
        Plot.ruleY([final], { stroke: '#88888888' }),
        Plot.text([final], {
          x: 65,
          y: final,
          dy: -7,
          text: (d) => `final: ${d.toFixed(3)}`,
        }),
      ],
    });
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
