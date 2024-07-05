<script>
    import { onDestroy, onMount } from 'svelte';
    import { Utils } from 'musicvis-lib';
    import * as Plot from '@observablehq/plot';
    import * as kde from 'fast-kde';
    import * as d3 from 'd3';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { BIN_NOTES, GRIDS } from '../lib/music';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import { clamp } from '../lib/lib';
    import RhythmPlayerButton from './common/rhythm-player-button.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import example from '../example-recordings/two-handed-timing.json';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1100;
    let containerLeft;
    let containerRight;
    // settings
    let tempo = 60;
    let gridLeft = GRIDS[1];
    let gridRight = GRIDS[0];
    let binNote = 64;
    let adjustTime = 0;
    let middleNote = 69;
    let showKde = true;
    let pastBars = 4;
    // data
    let firstTimeStamp = 0;
    let notes = [];

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes.push({
            time: noteInSeconds,
            number: e.note.number,
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

    const drawHand = (left = true) => {
        const grid = left ? gridLeft : gridRight;
        const [grid1, grid2] = grid.split(':').map((d) => +d);
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        let clamped = notes.filter(
            (d) =>
                // only look at left OR right hand
                (left && d.number < middleNote) ||
                (!left && d.number >= middleNote),
        );

        clamped = clamped.map((d) => (d.time + adjustTime) / quarter);
        if (pastBars > 0 && clamped.length > 0) {
            // only show most recent bars
            const lastBeat = (notes.at(-1).time + adjustTime) / quarter;
            const maxBar = Math.ceil(lastBeat / grid1);
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
        const fineGrid = d3.range(0, grid1 * grid2, 1 / grid2);

        const plot = Plot.plot({
            width,
            height: left ? 170 : 170 + 13,
            marginTop: 5,
            marginLeft: 10,
            marginRight: 10,
            marginBottom: left ? 5 : 15,
            padding: 0,
            x: {
                label: left ? null : 'time in beats (cyclic)',
                domain: [0, 4],
                ticks: [],
            },
            y: {
                axis: false,
                reverse: !left,
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

        const container = left ? containerLeft : containerRight;
        container.textContent = '';
        container.appendChild(plot);
    };

    const draw = () => {
        drawHand(true);
        drawHand(false);
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            gridLeft,
            gridRight,
            binNote,
            adjustTime,
            pastBars,
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            if (notes.length > 0) {
                saveToStorage();
            }
            tempo = json.tempo;
            gridLeft = json.gridLeft;
            gridRight = json.gridRight;
            binNote = json.binNote;
            adjustTime = json.adjustTime ?? 0;
            pastBars = json.pastBars;
            notes = json.notes;
            draw();
        }
    };
    const saveToStorage = () => {
        if (notes.length > 0) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onMount(draw);

    onDestroy(saveToStorage);

    const getRhythmNotes = (gridLeft, gridRight, tempo) => {
        if (!gridLeft) {
            return [];
        }
        const quarter = Utils.bpmToSecondsPerBeat(tempo);

        let beats = [gridLeft, gridRight].flatMap((grid, isRight) => {
            const [grid1, grid2] = grid.split(':').map((d) => +d);
            const fineGrid = d3.range(0, grid1, 1 / grid2);
            console.log({ grid1, grid2, fineGrid });
            return fineGrid.map((d) => {
                return {
                    time: d * quarter,
                    // number: isRight ? 62 : 69,
                    number: 69,
                };
            });
        });
        beats.sort((a, b) => a.time - b.time);
        console.log(beats);
        return beats;
    };
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI keyboard and start playing to the metronome. The chart
        will show you how a summary of where your notes started, the top one is
        for your left hand (keys left of the middle A) and the bottom one for
        your right hand. For example, you can try to play quarter triplets with
        your left and eighths with your right hand. If you do not have a MIDI
        keyboard, you can press the
        <code>f</code>
        key on your PC keyboard for left and <code>j</code> for right.
        <i> Try playing without looking, focus on the metronome. </i>
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid left
            <select bind:value="{gridLeft}" on:change="{draw}">
                {#each GRIDS as g}
                    <option value="{g}">{g}</option>
                {/each}
            </select>
        </label>
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            right
            <select bind:value="{gridRight}" on:change="{draw}">
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
            bars
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
    <div class="visualization" bind:this="{containerLeft}"></div>
    <div class="visualization" bind:this="{containerRight}"></div>
    <div class="control">
        <MetronomeButton {tempo} accent="{+gridLeft.split(':')[0]}" />
        <RhythmPlayerButton
            notes="{getRhythmNotes(gridLeft, gridRight, tempo)}"
        />
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <PcKeyboardInput
        key="f"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 0 } })}"
    />
    <PcKeyboardInput
        key="j"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 127 } })}"
    />
    <MidiInput {noteOn} {controlChange} />
</main>
