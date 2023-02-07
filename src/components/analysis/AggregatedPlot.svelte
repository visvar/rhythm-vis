<script>
  import * as Plot from '@observablehq/plot';
  import { max } from 'd3';
  import { afterUpdate } from 'svelte';

  export let onsetsInBeats;
  export let beats = 4;
  export let binsPerBeat = 20;
  export let width = 800;

  let groupSize = 4;
  let mode = 'histogram';
  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      width,
      height:
        mode === 'ticks'
          ? undefined
          : Math.floor(max(onsetsInBeats, (d) => d / beats / groupSize)) * 41 +
            35,
      marginTop: 5,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: 'beats' },
      // y: { label: 'frequency' },
      facet: {
        data: onsetsInBeats,
        y: (d) => Math.floor(d / beats / groupSize),
        marginBottom: 10,
      },
      marks: [
        mode === 'histogram'
          ? Plot.rectY(
              onsetsInBeats,
              Plot.binX(
                { y: 'count', thresholds: binsPerBeat * beats },
                { x: (d) => d % beats, fill: 'black' }
              )
            )
          : Plot.tickX(onsetsInBeats, {
              x: (d) => d % beats,
              stroke: 'black',
              opacity: 0.05,
              strokeWidth: 2,
            }),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <h4>Aggregated Repetitions</h4>
  <label title="Number of rows that will be aggregated into each summary row">
    group size
    <input
      bind:value="{groupSize}"
      type="number"
      min="1"
      max="32"
      step="1"
      style="width: 50px"
    />
  </label>
  <select bind:value="{mode}">
    <option value="histogram">histogram</option>
    <option value="ticks">ticks</option>
  </select>

  <div bind:this="{plotContainer}" width="{width}px"></div>
</main>
