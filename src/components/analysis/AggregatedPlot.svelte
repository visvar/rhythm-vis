<script>
  import * as Plot from '@observablehq/plot';
  import { extent, groups, max, range, scaleLinear } from 'd3';
  import * as kde from 'fast-kde';
  import { afterUpdate } from 'svelte';

  export let onsetsInBeats;
  export let beats = 4;
  export let width = 800;
  export let xTicks;
  export let exerciseNoteOnsetsInBeats;

  let groupSize = 2;
  let mode = 'density';
  let plotContainer;
  let histoBinsPerBeat = 20;
  let densBandwidth = 0.03;

  // row count and plot height
  $: rowCount = Math.ceil(max(onsetsInBeats, (d) => d / beats / groupSize));
  $: height = rowCount * 41 + 35;

  // ticks (and grid lines)
  let xTickValues;
  $: {
    if (xTicks === 'exercise') {
      xTickValues = exerciseNoteOnsetsInBeats;
    } else {
      xTickValues = range(0, beats, xTicks);
    }
  }

  afterUpdate(() => {
    plotContainer.textContent = '';
    if (onsetsInBeats.length === 0) {
      return;
    }
    let plot;

    const plotOptions = {
      width,
      height,
      marginTop: 5,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: 'beats', domain: [-0.5, beats + 0.5], ticks: xTickValues },
    };

    // density doesn't work with facetting
    if (mode === 'density') {
      // KDE area chart for each group
      let pad = 4;
      // let pad = 0;
      let bins = 512;
      const g = groups(onsetsInBeats, (d) => Math.floor(d / beats / groupSize));
      const marks = g.map((row, rowIndex) => {
        const onsets = row[1].map((d) => d % beats);
        const density1d = kde.density1d(onsets, {
          bandwidth: densBandwidth,
          pad,
          bins,
        });
        const points = [...density1d];
        const rowY = rowIndex;
        const scaleY = scaleLinear()
          .domain(extent(points, (d) => d.y))
          .range([rowY + 1, rowY]);
        return Plot.areaY(points, {
          x: 'x',
          y1: (d) => scaleY(d.y),
          y2: rowIndex + 1,
          sort: 'x',
          fill: '#ccc',
        });
      });
      plot = Plot.plot({
        ...plotOptions,
        y: {
          domain: [Math.ceil(max(onsetsInBeats) / beats / groupSize), 0],
          tickFormat: (d) => `${d * groupSize} - ${(d + 1) * groupSize - 1}`,
        },
        marks,
      });
      //
      //
      //
    } else {
      // mark mode
      let mark;
      if (mode === 'histogram') {
        // histogram for each group
        mark = Plot.rectY(
          onsetsInBeats,
          Plot.binX(
            { y: 'count', thresholds: histoBinsPerBeat * beats },
            { x: (d) => d % beats, fill: 'black' }
          )
        );
        //
        //
      } else if (mode === 'ticks') {
        // semi-transparent ticks for each group
        mark = Plot.tickX(onsetsInBeats, {
          x: (d) => d % beats,
          stroke: 'black',
          opacity: 0.1,
          strokeWidth: 2,
        });
        //
        //
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
      plot = Plot.plot({
        ...plotOptions,
        y: {
          ticks: false,
        },
        facet: {
          data: onsetsInBeats,
          y: (d) => Math.floor(d / beats / groupSize),
          marginBottom: 10,
        },
        marks: [mark],
      });
    }

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <h4>Aggregated Repetitions</h4>
  <div class="options">
    <select bind:value="{mode}">
      <option value="density">density</option>
      <option value="histogram">histogram</option>
      <option value="ticks">ticks</option>
      <option value="last">last</option>
    </select>

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

    {#if mode === 'histogram'}
      <label>
        bins per beat
        <input
          bind:value="{histoBinsPerBeat}"
          type="number"
          min="10"
          max="100"
          step="10"
          style="width: 50px"
        />
      </label>
    {/if}

    {#if mode === 'density'}
      <label>
        bandwidth
        <input
          bind:value="{densBandwidth}"
          type="number"
          min="0.01"
          max="1"
          step="0.01"
          style="width: 50px"
        />
      </label>
    {/if}
  </div>

  <div bind:this="{plotContainer}" width="{width}px"></div>
</main>

<style>
  .options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
</style>
