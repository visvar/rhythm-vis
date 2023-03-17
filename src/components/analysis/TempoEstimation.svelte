<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import * as kde from 'fast-kde';
  import { estimateBpmFromNotes } from '../../lib/tempo-estimation.js';
  import { maxIndex } from 'd3';

  export let notes;
  export let bpm;
  export let xLabel = 'x';
  export let width = 800;
  export let height = 60;

  export let bandwidth = 0.05;
  export let pad = 4;
  export let bins = 512;

  let plotContainer;

  $: bpmEstimate = estimateBpmFromNotes(notes, bpm);
  $: density1d = kde.density1d(bpmEstimate, { bandwidth, pad, bins });

  afterUpdate(() => {
    const densityPoints = [...density1d.bandwidth(bandwidth)];
    const plot = Plot.plot({
      width,
      height,
      marginTop: 18,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: xLabel, nice: true },
      y: { label: 'probability', nice: true },
      marks: [
        // use bandwidth method to update efficiently without re-binning
        Plot.areaY(densityPoints, {
          x: 'x',
          y: 'y',
          fill: '#ccc',
        }),
        Plot.ruleY([0]),
        Plot.ruleX([densityPoints[maxIndex(density1d, (d) => d.y)].x]),
        Plot.ruleY([densityPoints[maxIndex(density1d, (d) => d.y)].y], {
          stroke: '#eee',
        }),
        Plot.text(
          densityPoints,
          Plot.selectMaxY({
            x: 'x',
            y: 'y',
            text: (d) => `Most probable: ${d.x.toFixed(1)} bpm`,
            textAnchor: 'start',
            dx: 3,
            fill: 'black',
            stroke: 'white',
            strokeWidth: 2,
          })
        ),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main class="view">
  <h4>Tempo Estimation</h4>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
