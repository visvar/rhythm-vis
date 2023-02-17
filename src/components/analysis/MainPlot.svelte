<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { Midi } from 'musicvis-lib';
  import { drumPitchReplacementMap } from '../../lib/drums';

  export let notes;
  export let onsetsInBeats;
  export let exerciseNoteOnsetsInBeats;
  export let beats;
  export let contextBeats = 0;
  export let colorMode;
  // export let opacityMode;
  export let xTicks;
  export let currentTimeInBeats = 0;
  export let selectionEndTime = null;
  export let width = 800;
  export let height = 50;

  let plotContainer;
  let legendContainer;
  let plot;

  let isBrushing = false;

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
    } else if (colorMode === 'drums') {
      noteColor = (d, i) => notes[i].pitch;
      noteColorType = 'ordinal';
      noteColorTickFormat = (d) => drumPitchReplacementMap.get(d)?.label;
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

  // ticks (and grid lines)
  let xTickValues;
  $: {
    if (xTicks === 'exercise') {
      xTickValues = exerciseNoteOnsetsInBeats;
    } else {
      xTickValues = d3.range(-contextBeats, beats + contextBeats, xTicks);
    }
  }

  afterUpdate(() => {
    // note opacity
    // let opacity = (d) => 1;
    // if (opacityMode === 'velocity') {
    //   opacity = (d) => d.velocity;
    // }
    // if (opacityMode === 'duration') {
    //   const maxDuration = max(notes, (d) => d.duration);
    //   opacity = (d) => d.duration / maxDuration;
    // }
    plot = Plot.plot({
      width,
      marginTop: 3,
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
        // Selection
        selectionEndTime &&
          Plot.dot([selectionEndTime], {
            x: (d) => Math.max(0, d % beats),
            y: (d) => Math.floor(d / beats),
            fill: '#8883',
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
    plot.addEventListener('mousedown', handleClick);
    plot.addEventListener('mouseup', handleSelectionEnd);

    // Update legend
    const legend = plot.legend('color');
    legendContainer.textContent = '';
    if (legend) {
      legendContainer.appendChild(legend);
    }
  });

  const getTimeFromMouseEvent = (e) => {
    const { offsetX: x, offsetY: y } = e;
    const [min, max] = plot.scale('y').range;
    const rowCount = plot.scale('y').domain.length;
    const row = Math.floor((y / max) * rowCount);
    const xTime = plot.scale('x').invert(x);
    const time = beats * row + xTime;
    return time;
  };

  /**
   * Clicking on the visualization updates the currentTimeInBeats parameter
   * of this component and the parent component.
   * @param {PointerEvent} e mousedown event
   */
  const handleClick = (e) => {
    currentTimeInBeats = getTimeFromMouseEvent(e);
    if (e.ctrlKey) {
      isBrushing = true;
    }
  };

  /**
   * Clicking on the visualization updates the currentTimeInBeats parameter
   * of this component and the parent component.
   * @param {PointerEvent} e click event
   */
  const handleSelectionEnd = (e) => {
    if (isBrushing) {
      isBrushing = false;
      selectionEndTime = getTimeFromMouseEvent(e);
      if (selectionEndTime < currentTimeInBeats) {
        const tmp = selectionEndTime;
        selectionEndTime = currentTimeInBeats;
        currentTimeInBeats = tmp;
      }
    } else {
      selectionEndTime = null;
    }
  };
</script>

<main width="{width}px">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <div bind:this="{legendContainer}" width="{width}px"></div>
  <i>Select a time span by pressing CTRL and draging the mouse.</i>
</main>

<style>
</style>
