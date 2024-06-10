<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
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
    import { clamp } from '../lib/lib';
    import { BIN_NOTES, GRIDS } from '../lib/music';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let midiDevices = [];
    let container;
    // settings
    let tempo = 120;
    let grid = GRIDS[0];
    let binNote = 64;
    let adjustTime = 0;
    let noteTickLimit = 100;
    // data
    let firstTimeStamp = 0;
    let noteOnTimes = [];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('noteon', noteOn);
                device.addListener('controlchange', controlChange);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

    const noteOn = (e) => {
        if (noteOnTimes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        noteOnTimes.push(noteInSeconds);
        draw();
    };

    const keyDown = (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            noteOn({ timestamp: performance.now() });
        }
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
        const notes = noteOnTimes.map((d) => (d + adjustTime) / quarter);
        const clamped = notes.map((d) => d % grid1);

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
        const fineGrid = d3.range(0, grid1 * grid2, 1 / grid2);
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
            marginLeft: 60,
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
                    fill: (d) => '#e4f0fa',
                    clip: true,
                }),
                Plot.ruleY([0]),
                ...gridLines,
            ],
        });

        const tickPlot = Plot.plot({
            ...plotOptions,
            color: {
                scheme: 'viridis',
                reverse: true,
                domain: [0, lastNotes.length],
            },
            marks: [
                Plot.tickX(lastNotes, {
                    x: (d) => d,
                    stroke: (d, i) => i,
                    clip: true,
                }),
            ],
        });

        container.textContent = '';
        container.appendChild(histoPlot);
        container.appendChild(kdePlot);
        container.appendChild(tickPlot);
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
            noteTickLimit,
            noteOnTimes,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            noteOnTimes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            tempo = json.tempo;
            grid = json.grid;
            binNote = json.binNote;
            adjustTime = json.adjustTime ?? 0;
            noteTickLimit = json.noteTickLimit ?? 0;
            noteOnTimes = json.noteOnTimes;
            draw();
        }
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        draw();
        document.addEventListener('keydown', keyDown);
    });

    onDestroy(() => {
        // remove MIDI listeners to avoid duplicate calls and improve performance
        for (const input of WebMidi.inputs) {
            input.removeListener();
        }
        document.removeEventListener('keydown', keyDown);
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument (currently {midiDevices.length} connected), choose
        your tempo and subdivision, and start playing. The bar chart will show you
        how often you hit each time bin and the last {noteTickLimit} notes will be
        shown as ticks that fade out one new notes come in (from red for new to blue
        for old). You can play freely, use the integrated metronome, or play a song
        in the background (in another tab). All notes will be timed relative to the
        first one, but you can adjust all notes to make them earlier or later in
        case you messed up the first one.
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
    <div class="control">
        <ResetNotesButton bind:notes="{noteOnTimes}" callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
        <MetronomeButton {tempo} accent="{+grid.split(':')[0]}" />
    </div>
</main>