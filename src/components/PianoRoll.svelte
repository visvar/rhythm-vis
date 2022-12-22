<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let notes;
  export let metronomeClicks;
  export let width = 800;
  export let height = 200;

  let plotContainer;

  afterUpdate(() => {
    plotContainer.textContent = '';
    const plot = Plot.plot({
      insetRight: 10,
      // height: 400,
      width,
      height,
      x: {
        // label: 'Time in beats',
        label: 'Time in seconds',
      },
      y: {
        label: 'MIDI Pitch',
        domain: d3.range(...d3.extent(notes, (d) => d.pitch)),
        grid: true,
      },
      r: {
        // legend: true,
        range: [0, 8],
      },
      color: {
        scheme: 'rainbow',
        type: 'ordinal',
        legend: true,
        // tickFormat: (d) => mvlib.Midi.NOTE_NAMES[d],
      },
      marks: [
        Plot.dot(notes, {
          // x: (d) => (d.start - notes[0].start) / spb,
          x: (d) => d.start,
          y: (d) => d.pitch,
          r: (d) => d.end - d.start,
          // r: (d) => d.velocity,
          title: (d) => `${d.name}\n${d.start.toFixed(1)}`,
          fill: (d) => d.pitch % 12,
        }),
        Plot.ruleX(metronomeClicks),
      ],
    });

    plotContainer.appendChild(plot);
  });
</script>

<main>
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>
