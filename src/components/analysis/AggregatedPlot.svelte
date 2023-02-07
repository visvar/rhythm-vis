<script>
  import * as Plot from '@observablehq/plot';
  import { groups, max } from 'd3';
  import { afterUpdate } from 'svelte';
  import HistogramPlot from './HistogramPlot.svelte';
  import TickPlot from './TickPlot.svelte';

  export let onsetsInBeats;
  export let beats = 4;
  export let contextBeats = 0;
  export let binsPerBeat = 20;
  export let width = 800;

  let groupSize = 4;
  let mode = 'histogram';

  let rows = [];
  $: {
    // group <groupSize> repetitions together
    rows = groups(onsetsInBeats, (d) => Math.floor(d / beats / groupSize)).map(
      (d) => d
    );
    console.log(rows);
  }

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
        margin: 2,
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
  <!-- {#if mode === 'Histogram'}
    <HistogramPlot
      width="{width}"
      values="{onsetsInBeats}"
      beats="{beats}"
      contextBeats="{contextBeats}"
      binsPerBeat="{binsPerBeat}"
    />
  {/if}
  {#if mode === 'Ticks'}
    <TickPlot
      width="{width}"
      values="{onsetsInBeats}"
      beats="{beats}"
      contextBeats="{contextBeats}"
    />
  {/if} -->
</main>
