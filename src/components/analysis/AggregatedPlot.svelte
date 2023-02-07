<script>
  import * as Plot from '@observablehq/plot';
  import { max } from 'd3';
  import { afterUpdate } from 'svelte';

  export let onsetsInBeats;
  export let beats = 4;
  export let width = 800;

  let groupSize = 4;
  // let mode = 'histogram';
  let mode = 'last';
  let plotContainer;
  let binsPerBeat = 20;

  afterUpdate(() => {
    // mark mode
    let mark;
    if (mode === 'histogram') {
      // histogram for each group
      mark = Plot.rectY(
        onsetsInBeats,
        Plot.binX(
          { y: 'count', thresholds: binsPerBeat * beats },
          { x: (d) => d % beats, fill: 'black' }
        )
      );
    } else if (mode === 'ticks') {
      // semi-transparent ticks for each group
      mark = Plot.tickX(onsetsInBeats, {
        x: (d) => d % beats,
        stroke: 'black',
        opacity: 0.1,
        strokeWidth: 2,
      });
    } else if (mode === 'last') {
      // opaque ticks for the last row of each group
      mark = Plot.tickX(onsetsInBeats, {
        filter: (d) => {
          const row = Math.floor(d / beats);
          return row % groupSize === groupSize - 1;
        },
        x: (d) => d % beats,
        stroke: 'black',
        strokeWidth: 2,
      });
    }
    // plot
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
      marks: [mark],
    });

    plotContainer.textContent = '';
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
    <option value="last">last</option>
  </select>
  {#if mode === 'histogram'}
    <label>
      bins per beat
      <input
        bind:value="{binsPerBeat}"
        type="number"
        min="10"
        max="100"
        step="10"
        style="width: 50px"
      />
    </label>
  {/if}

  <div bind:this="{plotContainer}" width="{width}px"></div>
</main>
