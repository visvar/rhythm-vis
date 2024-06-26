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
    const peakPoint = densityPoints[maxIndex(density1d, (d) => d.y)];
    // console.log(notes, bpmEstimate, densityPoints, peakPoint);
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
        // peak
        peakPoint ? Plot.ruleX([peakPoint.x]) : null,
        peakPoint
          ? Plot.ruleY([peakPoint.y], {
              stroke: '#eee',
            })
          : null,
        Plot.text(
          densityPoints,
          Plot.selectMaxY({
            x: 'x',
            y: 'y',
            text: (d) => `Estimated: ${d.x.toFixed(1)}`,
            textAnchor: 'start',
            dx: 3,
            fill: 'black',
            stroke: 'white',
            strokeWidth: 3,
          })
        ),
        // expected bpm
        bpm ? Plot.ruleX([bpm], { stroke: 'steelblue' }) : null,
        bpm
          ? Plot.text([{ x: bpm, y: 0 }], {
              x: 'x',
              y: 'y',
              text: (d) => `Expected: ${bpm}`,
              textAnchor: 'start',
              dx: 3,
              dy: -7,
              fill: 'black',
              stroke: 'white',
              strokeWidth: 3,
            })
          : null,
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
