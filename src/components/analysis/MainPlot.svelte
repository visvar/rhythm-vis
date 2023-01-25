<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { Midi } from 'musicvis-lib';

  export let notes;
  export let onsets;
  export let onsetsInBeats;
  export let beats;
  export let contextBeats;
  export let colorMode;
  export let xTicks;
  export let currentTimeInBeats;
  export let width = 800;
  export let height = 50;

  let plotContainer;
  let legendContainer;
  let plot;

  afterUpdate(() => {
    let noteColor;
    let noteColorType;
    let noteColorTickFormat;
    let noteColorScheme;
    if (colorMode === 'none') {
      noteColor = 'black';
    } else if (colorMode === 'chroma') {
      noteColor = (d, i) => notes[i].pitch % 12;
      noteColorType = 'ordinal';
      noteColorTickFormat = (d) => Midi.NOTE_NAMES[d];
      noteColorScheme = 'rainbow';
    } else if (colorMode === 'channel') {
      noteColor = (d, i) => notes[i].channel;
      noteColorType = 'ordinal';
      noteColorScheme = 'tableau10';
    } else if (colorMode === 'velocity') {
      noteColor = (d, i) => notes[i].velocity;
      noteColorType = 'linear';
      noteColorScheme = 'spectral';
    } else if (colorMode === 'duration') {
      noteColor = (d, i) => notes[i].end - notes[i].start;
      noteColorType = 'linear';
      noteColorScheme = 'spectral';
    }
    plot = Plot.plot({
      width,
      marginTop: 2,
      marginBottom: 16,
      grid: true,
      style: {
        background: 'none',
      },
      x: {
        label: 'beats',
        ticks: d3.range(-contextBeats, beats + contextBeats, xTicks),
        tickFormat: (d) => (d == d.toFixed(0) ? d.toFixed(0) : ''),
      },
      y: {
        label: 'row',
        domain: d3.range(0, Math.floor(d3.max(onsets) / beats)),
      },
      color: {
        type: noteColorType,
        scheme: noteColorScheme,
        tickFormat: noteColorTickFormat,
      },
      marks: [
        Plot.tickX(onsetsInBeats, {
          x: (d) => d % beats,
          y: (d) => Math.floor(d / beats),
          stroke: noteColor,
          strokeWidth: 2,
        }),
        // Context on the right
        Plot.tickX(
          onsetsInBeats.filter(
            (d) => Math.floor(d / beats) > 0 && d % beats < contextBeats
          ),
          {
            x: (d) => (d % beats) + beats,
            y: (d) => Math.floor(d / beats) - 1,
            stroke: '#ccc',
            strokeWidth: 2,
          }
        ),
        // Context on the left
        Plot.tickX(
          onsetsInBeats.filter(
            (d) =>
              // Math.floor(d / shownSeconds) > 0 &&
              d % beats > beats - contextBeats
          ),
          {
            x: (d) => (d % beats) - beats,
            y: (d) => Math.floor(d / beats) + 1,
            stroke: '#ccc',
            strokeWidth: 2,
          }
        ),
        // Current player time
        Plot.dot([currentTimeInBeats], {
          x: (d) => Math.max(0, d % beats),
          y: (d) => Math.floor(d / beats),
          stroke: 'red',
          r: 15,
        }),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);

    // Update legend
    const legend = plot.legend('color');
    legendContainer.textContent = '';
    if (legend) {
      legendContainer.appendChild(legend);
    }
  });
</script>

<main width="{width}px">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <div bind:this="{legendContainer}" width="{width}px"></div>
</main>

<style>
</style>
