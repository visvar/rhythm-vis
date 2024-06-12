<script>
    import { onMount } from 'svelte';
    import { Utils } from 'musicvis-lib';
    import * as Plot from '@observablehq/plot';
    import * as kde from 'fast-kde';
    import * as d3 from 'd3';
    import ImportButton from './common/import-button.svelte';
    import ExportButton from './common/export-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { BIN_NOTES, GRIDS } from '../lib/music';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import { clamp } from '../lib/lib';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let container;
    // settings
    let tempo = 60;
    let grid = GRIDS[0];
    let binNote = 64;
    let adjustTime = 0;
    let showKde = true;
    let pastBars = 4;
    // data
    let firstTimeStamp = 0;
    let notes = [];
    // knowledge
    export const drumPitchReplacementMapMD90 = new Map([
        // Crash 1
        [49, { repPitch: 49, label: 'CC', name: 'Crash Cymbal 1' }],
        [55, { repPitch: 49, label: 'CC', name: 'Crash Cymbal 1' }],
        [52, { repPitch: 57, label: 'CC', name: 'Crash Cymbal 2' }],
        [57, { repPitch: 57, label: 'CC', name: 'Crash Cymbal 2' }],
        // Hi-hat
        [22, { repPitch: 46, label: 'HH', name: 'Hi-Hat' }],
        [26, { repPitch: 46, label: 'HH', name: 'Hi-Hat' }],
        [42, { repPitch: 46, label: 'HH', name: 'Hi-Hat' }],
        [46, { repPitch: 46, label: 'HH', name: 'Hi-Hat' }],
        [44, { repPitch: 44, label: 'HH', name: 'Hi-Hat Pedal' }],
        // Ride
        [51, { repPitch: 51, label: 'Rd', name: 'Ride Cymbal' }],
        [53, { repPitch: 51, label: 'Rd', name: 'Ride Cymbal' }],
        [59, { repPitch: 51, label: 'Rd', name: 'Ride Cymbal' }],
        // Snare
        [38, { repPitch: 38, label: 'SN', name: 'Snare' }],
        [40, { repPitch: 38, label: 'SN', name: 'Snare' }],
        // Tom
        [48, { repPitch: 48, label: 'TO', name: 'Tom 1' }],
        [50, { repPitch: 48, label: 'TO', name: 'Tom 1' }],
        [45, { repPitch: 45, label: 'TO', name: 'Tom 2' }],
        [47, { repPitch: 45, label: 'TO', name: 'Tom 2' }],
        [43, { repPitch: 43, label: 'TO', name: 'Stand Tom 1' }],
        [58, { repPitch: 43, label: 'TO', name: 'Stand Tom 1' }],
        [39, { repPitch: 41, label: 'TO', name: 'Stand Tom 2' }],
        [41, { repPitch: 41, label: 'TO', name: 'Stand Tom 2' }],
        // Bass drum
        [35, { repPitch: 36, label: 'KD', name: 'Kick Drum' }],
        [36, { repPitch: 36, label: 'KD', name: 'Kick Drum' }],
    ]);

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes.push({
            time: noteInSeconds,
            number: e.note.number,
            drum:
                drumPitchReplacementMapMD90.get(e.note.number)?.label ??
                e.note.number,
        });
        draw();
    };

    /**
     * Allow controlling vis with a MIDI knob
     * @param e MIDI controllchange event
     */
    const controlChange = (e) => {
        const c = e.controller.number;
        if (c === 14) {
            // tempo
            tempo = clamp(e.rawValue, 0, 120) + 60;
        } else if (c === 15) {
            // binning
            binNote =
                BIN_NOTES[
                    clamp(Math.floor(e.rawValue / 5), 0, BIN_NOTES.length - 1)
                ];
        } else if (c === 16) {
            // adjust
            adjustTime = (clamp(e.rawValue, 0, 100) - 50) / 100;
        } else if (c === 17) {
            pastBars = clamp(e.rawValue, 0, 99) + 1;
        } else if (c === 18) {
        }
        draw();
    };

    const drawDrum = (drum = 'KD', xLabel = null) => {
        const [grid1, grid2] = grid.split(':').map((d) => +d);
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        // only look at one drum part
        let clamped = notes.filter((d) => d.drum === drum);

        clamped = clamped.map((d) => (d.time + adjustTime) / quarter);
        if (pastBars > 0 && clamped.length > 0) {
            // only show most recent bars
            const maxBar = Math.floor(clamped.at(-1) / grid1);
            clamped = clamped.filter((d) => d / grid1 >= maxBar - pastBars);
        }
        clamped = clamped.map((d) => d % grid1);

        // KDE
        let kdePoints = [];
        if (clamped.length > 0) {
            let bandwidth = 4 / binNote;
            let pad = 1;
            let bins = width / 2;
            const density1d = kde.density1d(clamped, {
                bandwidth,
                pad,
                bins,
            });
            kdePoints = density1d.bandwidth(bandwidth);
        }

        const coarseGrid = d3.range(0, grid1 + 1, 1);
        const fineGrid = d3.range(0, grid1, 1 / grid2);

        const plot = Plot.plot({
            width,
            height: 90,
            marginLeft: 60,
            marginBottom: 10,
            padding: 0,
            x: {
                label: xLabel,
                domain: [0, 4],
                ticks: [],
            },
            y: {
                axis: false,
            },
            marks: [
                showKde
                    ? Plot.areaY(kdePoints, {
                          x: 'x',
                          y: 'y',
                          fill: (d) => '#e4f0fa',
                          clip: true,
                      })
                    : Plot.rectY(
                          clamped,
                          Plot.binX(
                              { y: 'count' },
                              {
                                  x: (d) => d,
                                  fill: '#ccc',
                                  thresholds: d3.range(
                                      0,
                                      grid1 + 1,
                                      4 / binNote,
                                  ),
                              },
                          ),
                      ),

                Plot.ruleY([0]),
                // beat grid
                Plot.tickX(fineGrid, {
                    stroke: '#888',
                }),
                Plot.tickX(coarseGrid, {
                    stroke: '#888',
                    strokeWidth: 3,
                }),
            ],
        });

        const title = document.createElement('span');
        title.innerText = drum;
        container.appendChild(title);
        container.appendChild(plot);
    };

    const draw = () => {
        container.textContent = '';
        drawDrum('HH');
        drawDrum('SN');
        drawDrum('TO');
        drawDrum('KD', 'time in beats');
    };

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            tempo,
            grid,
            binNote,
            adjustTime,
            pastBars,
            noteOnTimes: notes,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            tempo = json.tempo;
            grid = json.grid;
            binNote = json.binNote;
            adjustTime = json.adjustTime ?? 0;
            pastBars = json.pastBars;
            notes = json.noteOnTimes;
            draw();
        }
    };

    onMount(draw);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI drum kit and start playing to the metronome. The chart
        will show you how a summary of where your notes started, one for each
        type of drum. If you do not have a MIDI keyboard, you can press the
        <code>s</code>
        key on your PC keyboard for snare and <code>k</code> for kick drum.
        <i> Try playing without looking, focus on the metronome. </i>
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid
            <select bind:value="{grid}" on:change="{draw}">
                {#each GRIDS as g}
                    <option value="{g}">{g}</option>
                {/each}
            </select>
        </label>
        <label
            title="The width of each bar in rhythmic units. For example, each bin could be a 32nd note wide."
        >
            binning
            <select bind:value="{binNote}" on:change="{draw}">
                {#each BIN_NOTES as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
        <label title="Shift all notes by an amount in seconds">
            adjust
            <input
                type="number"
                bind:value="{adjustTime}"
                on:change="{draw}"
                step="0.01"
                min="-2"
                max="2"
                style="width: 55px"
            />
        </label>
        <label
            title="The number of past bars to be shown. Allows to 'forget' mistakes in the beginning."
        >
            last bars
            <input
                type="number"
                bind:value="{pastBars}"
                on:change="{draw}"
                min="1"
                max="100"
                style="width: 55px"
            />
        </label>
        <button
            title="Toggle between an area chart and a histogram of the note density"
            on:click="{() => {
                showKde = !showKde;
                draw();
            }}"
            style="width: 120px"
        >
            {showKde ? 'density area' : 'histogram'}
        </button>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
        <MetronomeButton {tempo} accent="{+grid.split(':')[0]}" />
    </div>
    <PcKeyboardInput
        key="s"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 38 } })}"
    />
    <PcKeyboardInput
        key="h"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 46 } })}"
    />
    <PcKeyboardInput
        key="t"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 48 } })}"
    />
    <PcKeyboardInput
        key="k"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 36 } })}"
    />
    <MidiInput {noteOn} {controlChange} />
</main>

<style>
    code {
        background-color: #eee;
        padding: 4px;
        border-radius: 4px;
    }
</style>
