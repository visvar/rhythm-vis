<script>
  import * as Plot from '@observablehq/plot';
  import * as d3 from 'd3';
  import { afterUpdate } from 'svelte';

  export let pattern;
  export let width = 800;
  export let height = 100;

  let plotContainer;

  afterUpdate(() => {
    const deltas = d3
      .groups(pattern, (d) => d.instr)
      .map(([instr, times]) =>
        times.map((t, i) => {
          console.log(t, i, times);
          return {
            index: i,
            instr,
            time: i === 0 ? 0 : t.time - times[i - 1].time,
          };
        }),
      )
      .flat();
    const plot = Plot.plot({
      width,
      height,
      marginLeft: 0,
      marginRight: 1,
      // x: { axis: false },
      y: { axis: false },
      color: {
        label: 'time since previous note',
        scheme: 'Greys',
        // legend: true,
      },
      fy: {
        domain: ['hihat', 'snare', 'bass'],
      },
      marks: [
        Plot.cell(deltas, {
          x: 'index',
          fill: 'time',
          fy: 'instr',
        }),
        // Plot.frame(),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main style="width: {width}px; margin: auto">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <!-- <div>
    For each note but the first, the rectangles' color shows the distance to the
    previous note. A brighter recangle indicates an early note.
  </div> -->
</main>
