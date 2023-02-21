<script>
  import * as Plot from '@observablehq/plot';
  import { extent, groups, max, range, scaleLinear } from 'd3';
  import * as kde from 'fast-kde';
  import { Midi } from 'musicvis-lib';
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
    let pad = 4;
    let bins = 512;

    let grpFn;
    let type = 'categorical';
    let scheme = 'tableau10';
    if (mode === 'chroma') {
      grpFn = (d) => Midi.MIDI_NOTES[d.pitch % 12]?.name ?? '';
    } else if (mode === 'pitch') {
      grpFn = (d) => d.pitch;
    } else if (mode === 'channel') {
      grpFn = (d) => d.channel;
    } else if (mode === 'drums') {
      grpFn = (d) => drumPitchReplacementMap.get(d.pitch)?.label ?? 'other';
    } else if (mode === 'drumsType') {
      grpFn = (d) => drumPitchReplacementMap.get(d.pitch)?.type ?? 'other';
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
      const rowY = rowIndex;
      const scaleY = scaleLinear()
        .domain(extent(points, (d) => d.y))
        .range([rowY + 1, rowY]);
      console.log(row[0]);
      return Plot.areaY(points, {
        x: 'x',
        y1: (d) => scaleY(d.y),
        y2: rowIndex + 1,
        sort: 'x',
        // fill: '#ccc',
        fill: rowIndex,
      });
    });

    const plot = Plot.plot({
      width,
      height: g.length * 41 + 35,
      marginTop: 5,
      marginBottom: 30,
      style: {
        background: 'none',
      },
      grid: true,
      x: { label: 'beats', domain: [-0.5, beats + 0.5], ticks: xTickValues },
      color: {
        type,
        scheme,
      },
      y: {
        reverse: true,
        tickFormat: (d) => (g[d] ? g[d][0] : ''),
      },
      marks,
    });

    plotContainer.appendChild(plot);
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
      <option value="drumsType">drumsType</option>
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
