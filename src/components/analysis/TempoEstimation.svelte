<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import * as kde from 'fast-kde';
  import { estimateBpmFromNotes } from '../../lib/tempo-estimation.js';

  export let notes;
  export let bpm;
  export let xLabel = 'x';
  export let width = 800;
  export let height = 50;

  export let bandwidth = 0.05;
  export let pad = 4;
  export let bins = 512;

  let plotContainer;

  $: bpmEstimate = estimateBpmFromNotes(notes, bpm);
  $: density1d = kde.density1d(bpmEstimate, { bandwidth, pad, bins });

  afterUpdate(() => {
    const densityPoints = density1d.bandwidth(bandwidth);
    const plot = Plot.plot({
      width,
      height,
      marginTop: 10,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: xLabel },
      // y: { label: 'frequency' },
      marks: [
        // use bandwidth method to update efficiently without re-binning
        Plot.areaY(densityPoints, {
          x: 'x',
          y: 'y',
          fill: '#ccc',
        }),
        Plot.ruleY([0]),
        Plot.text(
          densityPoints,
          Plot.selectMaxY({
            x: 'x',
            y: 'y',
            text: 'x',
            textAnchor: 'start',
            dx: 3,
          }),
          Plot.ruleX([0]),
          Plot.ruleX([100])
          // Plot.ruleX([densityPoints[maxIndex(densityPoints, (d) => d.y)]])
        ),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
