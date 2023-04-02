<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';
  import { max, range } from 'd3';
  import { drumPitchReplacementMap } from '../../lib/drums';
  import { Midi, Utils } from 'musicvis-lib';

  export let notes;
  export let onsetsInBeats;
  export let noteColorMode;
  export let currentTimeInBeats = 0;
  export let selectionStartTime = null;
  export let selectionEndTime = null;
  export let width = 800;
  export let height = 50;
  export let showControls = true;

  let plotContainer;
  let showOnlySelection = true;

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
    } else {
      color = 'black';
    }
  }

  const getPreviousNoteIndex = (time, onsets) => {
    for (let i = 0; i < onsets.length; i++) {
      if (onsets[i] > time) {
        return Math.max(i - 1, 0);
      }
    }
    return onsets.length;
  };

  $: deltas = [
    0,
    ...onsetsInBeats.slice(1).map((d, i) => d - onsetsInBeats[i]),
  ];
  $: maxDelta = max(deltas);
  $: yLimit = Utils.roundToNDecimals(maxDelta * 1.1, 1);

  $: prevNoteIndex = getPreviousNoteIndex(currentTimeInBeats, onsetsInBeats);

  afterUpdate(() => {
    let xDomain = undefined;
    const start = getPreviousNoteIndex(selectionStartTime, onsetsInBeats);
    const end = getPreviousNoteIndex(selectionEndTime, onsetsInBeats) + 2;
    if (showOnlySelection && selectionStartTime !== null) {
      xDomain = [start, end];
    }
    // plot
    const plot = Plot.plot({
      width,
      height: 300,
      marginTop: 18,
      marginBottom: 15,
      style: {
        background: 'none',
      },
      x: {
        label: 'note',
        domain: xDomain ? range(...xDomain) : undefined,
        tickFormat: (d) => '',
        tickSize: 0,
      },
      y: {
        label: 'distance to previous note in beats',
        grid: true,
        domain: [0, yLimit],
      },
      color: {
        type: colorType,
        scheme: colorScheme,
        tickFormat: colorTickFormat,
        label: noteColorMode,
      },
      marks: [
        // next note
        currentTimeInBeats === 0
          ? null
          : Plot.barY([prevNoteIndex], {
              x: (d) => d + 2,
              y: yLimit,
              fill: '#888888aa',
            }),
        Plot.barY(deltas, {
          x: (d, i) => i + 2,
          y: (d) => d,
          fill: color,
        }),
        // // time selection
        showOnlySelection || selectionStartTime === null
          ? null
          : Plot.rectX([true], {
              x1: (d) => start + 1,
              x2: (d) => end,
              fill: '#88888822',
            }),
        // // current player time
        // Plot.ruleX([currentTimeInBeats], {
        //   x: collapseRepetitions ? (d) => d % beats : (d) => d,
        // }),
        // Plot.dot(notes, {
        //   x: collapseRepetitions
        //     ? (d, i) => onsetsInBeats[i] % beats
        //     : (d, i) => onsetsInBeats[i],
        //   y: yAccessor,
        //   fill: color,
        //   r: 2,
        // }),
      ],
    });

    plotContainer.textContent = '';
    plotContainer.appendChild(plot);
  });
</script>

<main width="{width}px" class="view">
  <h4>Note Distance</h4>
  {#if showControls}
    <label>
      show only selection
      <input type="checkbox" bind:checked="{showOnlySelection}" />
    </label>
    <label>
      y limit
      <input
        type="range"
        bind:value="{yLimit}"
        min="0"
        max="{maxDelta}"
        step="0.01"
      />
      <input
        bind:value="{yLimit}"
        type="number"
        min="0"
        max="{maxDelta}"
        step="0.01"
      />
    </label>
  {/if}
  <div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
</main>

<style>
  input[type='number'] {
    width: 60px;
  }

  label {
    display: inline-grid;
    grid-template-columns: auto auto auto;
    align-items: center;
    justify-items: end;
    gap: 3px;
  }
</style>
