<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { groups, min } from 'd3';
  import { drumPitchReplacementMap } from '../../lib/drums';
  import { Midi, Utils } from 'musicvis-lib';

  export let notes;
  export let onsetsInBeats;
  export let exerciseNoteOnsetsInBeats;
  export let beats;
  export let contextBeats = 0;
  export let noteColorMode;
  export let thicknessMode;
  export let xTicks;
  export let currentTimeInBeats = 0;
  export let selectionStartTime = null;
  export let selectionEndTime = null;
  export let width = 800;
  export let height = 50;
  export let rowLimit = Infinity;

  let plotContainer;
  let legendContainer;
  let plot;
  let isBrushing = false;
  let align = false;
  let minRow = 0;

  // note thickness
  let thickness;
  $: {
    if (thicknessMode === 'none') {
      thickness = 2;
    } else if (thicknessMode === 'velocity') {
      thickness = (d, i) => notes[i].velocity * 2;
    } else if (thicknessMode === 'duration') {
      thickness = (d, i) => Math.min(notes[i].duration * 2, 4);
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

  // note color
  let color;
  let colorType;
  let colorTickFormat = (d) => d;
  let colorScheme;
  $: {
    colorTickFormat = (d) => d;
    if (noteColorMode === 'none') {
      color = 'black';
    } else if (noteColorMode === 'chroma') {
      color = (d, i) => notes[i].pitch % 12;
      colorType = 'ordinal';
      colorTickFormat = (d) => Midi.NOTE_NAMES[d];
      colorScheme = 'rainbow';
    } else if (noteColorMode === 'pitch') {
      color = (d, i) => notes[i]?.pitch;
      colorType = 'linear';
      colorScheme = 'viridis';
    } else if (noteColorMode === 'drums') {
      color = (d, i) => drumPitchReplacementMap.get(notes[i].pitch)?.label;
      colorType = 'categorical';
      colorTickFormat = (d) => d ?? 'other';
      colorScheme = 'tableau10';
    } else if (noteColorMode === 'drumsType') {
      color = (d, i) => drumPitchReplacementMap.get(notes[i].pitch)?.type;
      colorType = 'categorical';
      colorTickFormat = (d) => d ?? 'other';
      colorScheme = 'tableau10';
    } else if (noteColorMode === 'channel') {
      color = (d, i) => notes[i].channel;
      colorType = 'ordinal';
      colorScheme = 'tableau10';
    } else if (noteColorMode === 'velocity') {
      color = (d, i) => notes[i].velocity;
      colorType = 'linear';
      colorScheme = 'greys';
    } else if (noteColorMode === 'duration') {
      color = (d, i) => notes[i].duration;
      colorType = 'linear';
      colorScheme = 'greys';
    } else if (noteColorMode === 'error') {
      color = (d, i) => {
        const x = d % beats;
        return min(xTickValues.map((d) => Math.abs(d - x)));
      };
      colorType = 'linear';
      colorScheme = 'reds';
    }
  }

  afterUpdate(() => {
    const maxRow = Math.ceil(d3.max(onsetsInBeats) / beats);
    minRow = rowLimit === Infinity ? 0 : Math.max(0, maxRow - rowLimit);
    const yDomain = d3.range(minRow, maxRow);
    let rowAlign = new Array(yDomain.length).fill(0);
    if (align) {
      const groupedByRow = groups(onsetsInBeats, (d) => Math.floor(d / beats));
      rowAlign = groupedByRow.map(([key, values]) => values[0] % beats);
    }
    // selection
    let selectionMarks = [];
    if (selectionEndTime) {
      const row1 = Math.floor(selectionStartTime / beats);
      const row2 = Math.floor(selectionEndTime / beats);
      selectionMarks = [
        Plot.rect([1], {
          x1: selectionStartTime % beats,
          x2: row1 === row2 ? selectionEndTime % beats : beats,
          y1: row1,
          y2: row1 + 1,
          fill: '#8882',
          rx: 5,
          dy: '50%',
        }),
      ];
      for (let row = row1 + 1; row <= row2; row++) {
        selectionMarks.push(
          Plot.rect([1], {
            x1: 0,
            x2: row === row2 ? selectionEndTime % beats : beats,
            y1: row,
            y2: row + 1,
            fill: '#8882',
            rx: 5,
            dy: '50%',
          })
        );
      }
    }
    // plot
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
        tickFormat: (d) =>
          Utils.roundToNDecimals(d, 2) == d.toFixed(0) ? d.toFixed(0) : '',
        domain: [-contextBeats, beats + contextBeats],
      },
      y: {
        label: 'row',
        domain: yDomain,
      },
      color: {
        type: colorType,
        scheme: colorScheme,
        tickFormat: colorTickFormat,
        label: noteColorMode,
      },
      marks: [
        ...selectionMarks,
        // Current player time
        Plot.dot([currentTimeInBeats], {
          x: (d) => Math.max(0, d % beats),
          y: (d) => Math.floor(d / beats),
          fill: '#8886',
          r: 15,
        }),
        // Main data
        Plot.tickX(onsetsInBeats, {
          x: (d) => (d - rowAlign[Math.floor(d / beats) - minRow]) % beats,
          y: (d) => Math.floor(d / beats),
          stroke: color,
          strokeWidth: thickness,
          // title: (d, i) => notes[i].name,
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
            strokeWidth: thickness,
          }
        ),
        // Context on the left
        Plot.tickX(
          onsetsInBeats.filter((d) => d % beats > beats - contextBeats),
          {
            x: (d) => (d % beats) - beats,
            y: (d) => Math.floor(d / beats) + 1,
            stroke: '#ccc',
            strokeWidth: thickness,
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
      selectionStartTime = currentTimeInBeats;
    } else {
      selectionStartTime = null;
      selectionEndTime = null;
    }
  };
</script>

<main width="{width}px">
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
  <div bind:this="{legendContainer}" width="{width}px"></div>
  <i>Select a time span by pressing CTRL and draging the mouse.</i>
  <label>
    Align first note to start of row
    <input type="checkbox" bind:checked="{align}" />
  </label>
</main>

<style>
</style>
