<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

  export let notes;
  export let metronomeClicks;
  export let metronomeAccents;
  export let pcm = null;
  export let audioDuration = 0;
  export let width = 800;
  export let height = 200;

  let pianoRollContainer;
  let audioPlotContainer;
  let legendContainer;

  const draw = () => {
    const maxTime = Math.max(
      notes.length > 0 ? d3.max(notes, (d) => d.end) : 0,
      ...metronomeClicks
    );

    // piano roll
    const plot = Plot.plot({
      insetRight: 10,
      width,
      height,
      x: {
        label: 'Time in seconds',
        domain: [0, maxTime],
      },
      y: {
        label: 'MIDI Pitch',
        grid: true,
      },
      color: {
        label: 'Note velocity',
        // legend: true,
        // scheme: 'rainbow',
        // type: 'ordinal',
        scheme: 'blues',
        // tickFormat: (d) => mvlib.Midi.NOTE_NAMES[d],
      },
      marks: [
        Plot.barX(notes, {
          x1: (d) => d.start,
          // drum notes have duration 0 and would be invisible
          x2: (d) => Math.max(d.end, d.start + 0.025),
          y: (d) => d.pitch,
          // fill: (d) => d.pitch % 12,
          fill: (d) => d.velocity,
          stroke: '#ccc',
          title: (d) =>
            `MIDI ${d.pitch} (${d.name})\nstart: ${d.start.toFixed(
              3
            )}\nduration: ${d.duration.toFixed(
              3
            )}\nvelocity: ${d.velocity.toFixed(3)}`,
        }),
        // metronome clicks
        Plot.ruleX(metronomeClicks, { stroke: 'gray', strokeWidth: 0.5 }),
        Plot.ruleX(metronomeAccents, { stroke: 'black', strokeWidth: 0.5 }),
        Plot.ruleX([0]),
      ],
    });
    // clear current plots and append new ones
    pianoRollContainer.textContent = '';
    pianoRollContainer.appendChild(plot);

    // audio PCM (amplitude over time, as binned area chart)
    if (pcm) {
      const plot2 = Plot.plot({
        insetRight: 10,
        width,
        height: 100,
        x: {
          label: 'Time in seconds',
          domain: [0, maxTime],
        },
        y: {
          label: 'Audio amplitude',
        },
        marks: [
          Plot.ruleX([0]),
          Plot.ruleY([0]),
          // metronome clicks
          Plot.ruleX(metronomeClicks, { stroke: 'gray', strokeWidth: 0.5 }),
          Plot.ruleX(metronomeAccents, { stroke: 'black', strokeWidth: 0.5 }),
          // PCM
          Plot.areaY(
            pcm,
            Plot.binX(
              { y: 'max', filter: null },
              {
                x: (d, i) => (i / pcm.length) * audioDuration,
                fill: '#333',
                thresholds: 500,
              }
            )
          ),
        ],
      });
      audioPlotContainer.textContent = '';
      audioPlotContainer.appendChild(plot2);
    }

    // color legend
    legendContainer.textContent = '';
    const legend = plot.legend('color');
    if (legend) {
      legendContainer.appendChild(legend);
    }
  };

  afterUpdate(draw);
</script>

<main class="view">
  <div
    bind:this="{pianoRollContainer}"
    width="{width}px"
    height="{height}px"
  ></div>
  <div
    bind:this="{audioPlotContainer}"
    width="{width}px"
    height="{100}px"
  ></div>
  <div bind:this="{legendContainer}" width="{width}px" height="{100}px"></div>
</main>

<style>
  div {
    padding: 0;
  }
</style>
