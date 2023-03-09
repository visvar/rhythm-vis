<script>
  /**
   * A chart one line for the note density of each group.
   * Grouped by pitch, chroma, ...
   */
  import * as Plot from '@observablehq/plot';
  import { extent, groups, max, range, scaleLinear } from 'd3';
  import * as kde from 'fast-kde';
  import { Midi, Utils } from 'musicvis-lib';
  import { afterUpdate } from 'svelte';
  import { drumPitchReplacementMap } from '../../lib/drums';

  export let notes;
  export let onsetsInBeats;
  export let beats = 4;
  export let width = 800;
  export let xTicks;
  export let exerciseNoteOnsetsInBeats;

  let mode = 'chroma';
  let densBandwidth = 0.03;
  let plotContainer;
  let legendContainer;

  // ticks (and grid lines)
  let xTickValues;
  $: {
    if (xTicks === 'exercise') {
      xTickValues = exerciseNoteOnsetsInBeats;
    } else {
      xTickValues = range(0, beats, xTicks);
    }
  }

  afterUpdate(() => {
    plotContainer.textContent = '';
    if (onsetsInBeats.length === 0) {
      return;
    }
    let plot;

    let pad = 4;
    let bins = 512;

    let grpFn;
    if (mode === 'chroma') {
      grpFn = (d) => Midi.MIDI_NOTES[d.pitch % 12].name;
    } else if (mode === 'pitch') {
      grpFn = (d) => d.pitch;
    } else if (mode === 'channel') {
      grpFn = (d) => d.channel;
    } else if (mode === 'drums') {
      grpFn = (d) => drumPitchReplacementMap.get(d.pitch)?.label ?? 'other';
    }
    const notesWithOnsets = notes.map((d, i) => {
      return { ...d, onsetInBeats: onsetsInBeats[i] };
    });
    const g = groups(notesWithOnsets, grpFn).sort((a, b) =>
      a[0] < b[0] ? -1 : 1
    );
    // KDE area chart for each group
    const marks = g.map((row, rowIndex) => {
      const onsets = row[1].map((d) => d.onsetInBeats % beats);
      const density1d = kde.density1d(onsets, {
        bandwidth: densBandwidth,
        pad,
        bins,
      });
      const points = [...density1d];
      const scaleY = scaleLinear().domain(extent(points, (d) => d.y));
      return Plot.lineY(points, {
        x: 'x',
        y: (d) => scaleY(d.y),
        sort: 'x',
        stroke: rowIndex,
      });
    });

    plot = Plot.plot({
      width,
      height: 80,
      marginTop: 5,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: {
        label: 'beats',
        domain: [-0.5, beats + 0.5],
        ticks: xTickValues,
        tickFormat: (d) =>
          Utils.roundToNDecimals(d, 2) == d.toFixed(0) ? d.toFixed(0) : '',
      },
      y: {
        label: 'density',
      },
      color: {
        type: 'categorical',
      },
      marks,
    });

    plotContainer.appendChild(plot);

    // legend
    const legend = plot.legend('color');
    legendContainer.textContent = '';
    if (legend) {
      legendContainer.appendChild(legend);
    }
  });
</script>

<main>
  <h4>Density Separated</h4>
  <div class="options">
    <select bind:value="{mode}">
      <option value="chroma">chroma</option>
      <option value="pitch">pitch</option>
      <option value="channel">channel</option>
      <option value="drums">drums</option>
    </select>

    <label>
      bandwidth
      <input
        bind:value="{densBandwidth}"
        type="number"
        min="0.01"
        max="1"
        step="0.01"
        style="width: 50px"
      />
    </label>
  </div>

  <div bind:this="{plotContainer}" width="{width}px"></div>
  <div bind:this="{legendContainer}" width="{width}px"></div>
</main>

<style>
  .options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  select {
    max-width: 200px;
  }
</style>
