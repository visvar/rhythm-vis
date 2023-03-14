<script>
  import * as d3 from 'd3';
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { min } from 'd3';
  import { drumPitchReplacementMap } from '../../lib/drums';
  import { Midi, Utils } from 'musicvis-lib';

  export let notes;
  export let onsetsInBeats;
  export let exerciseNoteOnsetsInBeats;
  export let beats;
  export let noteColorMode;
  export let thicknessMode;
  export let xTicks;
  export let currentTimeInBeats = 0;
  export let selectionStartTime = null;
  export let selectionEndTime = null;
  export let width = 800;
  export let height = 50;

  let plotContainer;
  let plot;
  let yMode = 'pitch';
  let showOnlySelection = true;
  let collapseRepetitions = false;

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
      const maxBeat = Math.ceil(d3.max(onsetsInBeats));
      xTickValues = d3.range(0, maxBeat, xTicks);
    }
    // simplify if too dense
    while (width / xTickValues.length < 20) {
      xTickValues = xTickValues.filter((d, i) => i % 2 === 0);
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

  // yMode
  let yAccessor;
  $: {
    if (yMode === 'pitch') {
      yAccessor = (d) => d.pitch;
    } else if (yMode === 'chroma') {
      yAccessor = (d) => d.pitch % 12;
    } else if (yMode === 'channel') {
      yAccessor = (d) => d.channel;
    } else if (yMode === 'velocity') {
      yAccessor = (d) => d.velocity;
    } else if (yMode === 'duration') {
      yAccessor = (d) => d.duration;
    } else if (yMode === 'drums') {
      yAccessor = (d) => drumPitchReplacementMap.get(d.pitch)?.row ?? -2;
    }
  }

  afterUpdate(() => {
    // plot
    plot = Plot.plot({
      width,
      marginTop: 15,
      marginBottom: 28,
      grid: true,
      style: {
        background: 'none',
      },
      x: {
        label: 'beats',
        // ticks: xTickValues,
        tickFormat: (d) =>
          Utils.roundToNDecimals(d, 2) == d.toFixed(0) ? d.toFixed(0) : '',
        domain:
          showOnlySelection && selectionStartTime !== null
            ? [selectionStartTime, selectionEndTime]
            : undefined,
      },
      y: {
        label: yMode,
      },
      color: {
        type: colorType,
        scheme: colorScheme,
        tickFormat: colorTickFormat,
        label: noteColorMode,
      },
      marks: [
        // time selection
        showOnlySelection
          ? null
          : Plot.rectX([true], {
              x1: (d) => selectionStartTime,
              x2: (d) => selectionEndTime,
              fill: '#88888822',
            }),
        // current player time
        Plot.ruleX([currentTimeInBeats], {
          x: collapseRepetitions ? (d) => d % beats : (d) => d,
        }),
        Plot.dot(notes, {
          x: collapseRepetitions
            ? (d, i) => onsetsInBeats[i] % beats
            : (d, i) => onsetsInBeats[i],
          y: yAccessor,
          fill: color,
          r: 2,
        }),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main width="{width}px">
  <h4>Scatterplot</h4>
  <label>
    x axis
    <select bind:value="{yMode}">
      <option value="pitch">pitch</option>
      <option value="chroma">chroma</option>
      <option value="channel">channel</option>
      <option value="velocity">velocity</option>
      <option value="duration">duration</option>
      <option value="drums">drums</option>
    </select>
  </label>
  show only selection
  <input type="checkbox" bind:checked="{showOnlySelection}" />
  collapse repetitions
  <input type="checkbox" bind:checked="{collapseRepetitions}" />
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>

<style>
</style>
