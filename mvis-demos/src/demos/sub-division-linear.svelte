<script>
    import { onDestroy, onMount } from 'svelte';
    import { Utils } from 'musicvis-lib';
    import * as Plot from '@observablehq/plot';
    import * as kde from 'fast-kde';
    import * as d3 from 'd3';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { clamp, computeSubdivisionOkScore } from '../lib/lib';
    import { BIN_NOTES, GRIDS } from '../lib/music';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import example from '../example-recordings/sub-division-linear.json';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import HistoryButton from './common/history-button.svelte';
    import TouchInput from './common/touch-input.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import { COLORS } from '../lib/colors';
    import RatingButton from './common/rating-button.svelte';
    import SubDivisionAdjustButton from './common/sub-division-adjust-button.svelte';
    import ShareConfigButton from './common/share-config-button.svelte';
    import UndoRedoButton from './common/undo-redo-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 900;
    let container;
    // settings
    let tempo = 120;
    let grid = GRIDS[0].divisions;
    let binNote = 64;
    let adjustTime = 0;
    let noteTickLimit = 500;
    let pastBars = 8;
    // data
    let firstTimeStamp = 0;
    let notes = [];
    let okScore = '';

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes = [...notes, noteInSeconds];
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
            // grid
            grid =
                GRIDS[clamp(Math.floor(e.rawValue / 5), 0, GRIDS.length - 1)];
        } else if (c === 16) {
            // binning
            binNote =
                BIN_NOTES[
                    clamp(Math.floor(e.rawValue / 5), 0, BIN_NOTES.length - 1)
                ];
        } else if (c === 17) {
            // adjust
            adjustTime = (clamp(e.rawValue, 0, 100) - 50) / 100;
        } else if (c === 18) {
            // note ticks
            noteTickLimit = Math.round(clamp(e.rawValue * 2, 0, 200));
        }
        draw();
    };

    const draw = () => {
        const [grid1, grid2] = grid.split(':').map((d) => +d);
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        const notesInBeats = notes.map((d) => (d + adjustTime) / quarter);
        const maxBar = Math.ceil((notesInBeats.at(-1) ?? 0) / grid1);
        const clamped = notesInBeats.map((d) => d % grid1);

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

        let lastNotes = [];
        if (noteTickLimit > 0) {
            lastNotes = clamped.slice(-noteTickLimit);
        }

        const coarseGrid = d3.range(0, grid1 + 1, 1);
        const fineGrid = d3.range(0, grid1, 1 / grid2);
        const gridLines = [
            Plot.tickX(fineGrid, {
                stroke: '#888',
            }),
            Plot.tickX(coarseGrid, {
                stroke: '#888',
                strokeWidth: 3,
            }),
        ];

        const plotOptions = {
            width,
            height: 90,
            marginTop: 0,
            marginLeft: 40,
            marginBottom: 10,
            padding: 0,
            x: {
                label: null,
                domain: [0, grid1],
                ticks: [],
            },
            y: {
                axis: false,
            },
        };

        const histoPlot = Plot.plot({
            ...plotOptions,
            marks: [
                Plot.rectY(
                    clamped,
                    Plot.binX(
                        { y: 'count' },
                        {
                            x: (d) => d,
                            fill: '#ccc',
                            thresholds: d3.range(0, grid1 + 1, 4 / binNote),
                        },
                    ),
                ),
                Plot.ruleY([0]),
                ...gridLines,
            ],
        });
        const kdePlot = Plot.plot({
            ...plotOptions,
            marks: [
                Plot.areaY(kdePoints, {
                    x: 'x',
                    y: 'y',
                    fill: (d) => COLORS.accent,
                    clip: true,
                }),
                Plot.ruleY([0]),
                ...gridLines,
            ],
        });

        const tickPlotSum = Plot.plot({
            ...plotOptions,
            height: 60,
            marginBottom: 30,
            x: {
                ticks: [...fineGrid, grid1],
                label: 'time in beats',
                domain: [0, grid1],
            },
            marks: [
                // ticks
                Plot.tickX(notesInBeats.slice(-noteTickLimit), {
                    x: (d) => d % grid1,
                    stroke: '#0002',
                    clip: true,
                }),
            ],
        });

        const tickPlotRows = Plot.plot({
            ...plotOptions,
            height: 180,
            marginBottom: 30,
            x: {
                ticks: [...fineGrid, grid1],
                label: 'time in beats',
                domain: [0, grid1],
            },
            y: {
                domain: d3.range(maxBar - pastBars, maxBar),
            },
            marks: [
                // OK areas
                Plot.tickX([...fineGrid, grid1], {
                    x: (d) => d,
                    stroke: '#eee',
                    clip: true,
                    strokeWidth: (width / binNote) * 2,
                }),
                // ticks
                Plot.tickX(notesInBeats.slice(-noteTickLimit), {
                    x: (d) => d % grid1,
                    y: (d, i) => Math.floor(d / grid1),
                    // stroke: '#0002',
                    clip: true,
                }),
            ],
        });

        container.textContent = '';
        container.appendChild(histoPlot);
        container.appendChild(kdePlot);
        container.appendChild(tickPlotSum);
        container.appendChild(tickPlotRows);

        // show how many notes are within the OK areas
        if (notes.length > 0) {
            const score = computeSubdivisionOkScore(
                notes,
                grid,
                tempo,
                binNote,
                adjustTime,
            );
            const percent = ((score / notes.length) * 100).toFixed();
            okScore = `${percent}% of notes are within the gray areas`;
        }
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            grid,
            binNote,
            adjustTime,
            noteTickLimit,
            notes,
        };
    };

    const loadData = (json) => {
        saveToStorage();
        tempo = json.tempo;
        grid = json.grid;
        binNote = json.binNote;
        adjustTime = json.adjustTime;
        noteTickLimit = json.noteTickLimit ?? 0;
        // data
        notes = json.notes;
        draw();
    };

    const saveToStorage = () => {
        if (
            notes.length > 0 &&
            JSON.stringify(notes) !== JSON.stringify(example.notes)
        ) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Choose your tempo and subdivision, and start playing. The bar and area
        charts will show you a summary of when you played notes. Use the
        integrated metronome. All notes will be timed relative to the first one,
        but you can adjust all notes to make them earlier or later in case you
        messed up the first. The last few bars you play will be shown in a row
        below.
    </p>
    <p>
        <i> Try playing without looking, focus on the metronome. </i>
    </p>
    <ExerciseDrawer>
        <p>1) Play triplets.</p>
        <p>
            2) Switch back and forth between a half bar of eighths and a half
            bar of triplets.
        </p>
        <p>
            3) Play a swing feel, where you shift every second note a bit late.
            Try to do this consistently!
        </p>
    </ExerciseDrawer>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <label
            title="The whole width is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid
            <select bind:value="{grid}" on:change="{draw}">
                {#each GRIDS as g}
                    <option value="{g.divisions}">{g.label}</option>
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
        <SubDivisionAdjustButton
            bind:adjustTime
            {tempo}
            {grid}
            {notes}
            {draw}
        />
        <label title="The number of most recent notes that are shown as ticks.">
            note ticks
            <input
                type="number"
                bind:value="{noteTickLimit}"
                on:change="{draw}"
                step="1"
                min="0"
                max="100"
                style="width: 55px"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div>{okScore}</div>
    <div class="control">
        <MetronomeButton {tempo} accent="{+grid.split(':')[0]}" />
        <UndoRedoButton bind:data="{notes}" callback="{draw}" />
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <HistoryButton demoId="{demoInfo.id}" {loadData} />
        <ShareConfigButton {getExportData} {loadData} />
    </div>
    <RatingButton appId="{demoInfo.id}" />
    <PcKeyboardInput
        key=" "
        keyDown="{() => noteOn({ timestamp: performance.now() })}"
    />
    <TouchInput
        element="{container}"
        touchStart="{() => noteOn({ timestamp: performance.now() })}"
    />
    <MidiInput {noteOn} {controlChange} />
</main>
