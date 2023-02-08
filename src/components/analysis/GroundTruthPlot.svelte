<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { Midi } from 'musicvis-lib';

  export let notes;
  export let onsetsInBeats;
  export let beats;
  export let contextBeats = 0;
  export let colorMode;
  export let xTicks;
  export let currentTimeInBeats = 0;
  export let width = 800;
  export let height = 50;

  let plotContainer;
  let plot;

  // note colors
  let noteColor;
  let noteColorType;
  let noteColorTickFormat;
  let noteColorScheme;
  $: {
    if (colorMode === 'none') {
      noteColor = 'black';
    } else if (colorMode === 'chroma') {
      noteColor = (d, i) => notes[i].pitch % 12;
      noteColorType = 'ordinal';
      noteColorTickFormat = (d) => Midi.NOTE_NAMES[d];
      noteColorScheme = 'rainbow';
    } else if (colorMode === 'pitch') {
      noteColor = (d, i) => notes[i].pitch;
      noteColorType = 'ordinal';
      noteColorTickFormat = (d) => d;
      noteColorScheme = 'spectral';
    } else if (colorMode === 'channel') {
      noteColor = (d, i) => notes[i].channel;
      noteColorType = 'ordinal';
      noteColorTickFormat = (d) => d;
      noteColorScheme = 'tableau10';
    } else if (colorMode === 'velocity') {
      noteColor = (d, i) => notes[i].velocity;
      noteColorType = 'linear';
      noteColorTickFormat = (d) => d;
      noteColorScheme = 'greys';
    } else if (colorMode === 'duration') {
      noteColor = (d, i) => notes[i].end - notes[i].start;
      noteColorType = 'linear';
      noteColorTickFormat = (d) => d;
      noteColorScheme = 'spectral';
    }
  }

  afterUpdate(() => {
    let xTickValues;
    if (xTicks === 'exercise') {
      xTickValues = onsetsInBeats;
    } else {
      xTickValues = d3.range(-contextBeats, beats + contextBeats, xTicks);
    }
    plot = Plot.plot({
      width,
      height: 50,
      marginTop: 2,
      marginBottom: 18,
      grid: true,
      style: {
        background: 'none',
      },
      x: {
        label: 'beats',
        ticks: xTickValues,
        tickFormat: (d) => (d == d.toFixed(0) ? d.toFixed(0) : ''),
        domain: [-contextBeats, beats + contextBeats],
      },
      y: {
        label: 'row',
        domain: d3.range(0, Math.ceil(d3.max(onsetsInBeats) / beats)),
      },
      color: {
        type: noteColorType,
        scheme: noteColorScheme,
        tickFormat: noteColorTickFormat,
      },
      marks: [
        // Current player time
        Plot.dot([currentTimeInBeats], {
          x: (d) => Math.max(0, d % beats),
          y: (d) => Math.floor(d / beats),
          fill: '#8886',
          r: 15,
        }),
        // Main data
        Plot.tickX(onsetsInBeats, {
          x: (d) => d % beats,
          y: (d) => Math.floor(d / beats),
          stroke: noteColor,
          strokeWidth: 2,
          // strokeOpacity: opacity,
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
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main width="{width}px">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>

<style>
</style>
