<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Midi } from 'musicvis-lib';
    import MidiInput from './common/midi-input.svelte';
    import { detectChords } from '../lib/chords';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import LoadFromStorageButton from './common/history-button.svelte';
    import example from '../example-recordings/chord-arpeggio-timing.json';
    import ExerciseDrawer from './common/exercise-drawer.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 400;
    let container;
    // settings
    let pastSeconds = 10;
    let maxNoteDistance = 0.2;
    // data
    let firstTimeStamp = 0;
    let notes = [];

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = {
            // ...e.note,
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        const maxTime = d3.max(notes, (d) => d.time) + 0.5;
        const minTime = maxTime - pastSeconds;
        // only handle recent notes
        const filtered = notes.filter(
            (d) => d.end > minTime || d.end === undefined,
        );
        // clustering to chords
        const chords = detectChords(filtered, maxNoteDistance);
        const chordExtents = chords.map((c) => d3.extent(c, (d) => d.time));
        const chordGaps = chordExtents
            .slice(1)
            .map((d, i) => [chordExtents[i][0], d[0]]);

        // plot
        const plot = Plot.plot({
            insetRight: 10,
            width,
            height,
            marginLeft: 60,
            marginBottom: 40,
            padding: 0,
            x: {
                label: 'Time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                label: 'MIDI Pitch',
                grid: true,
                reverse: true,
                // domain: d3.range(pitchExtent[0] - 1, pitchExtent[1] + 2),
                // type: 'linear',
                tickFormat: (d) => Midi.MIDI_NOTES[d].label,
            },
            marks: [
                Plot.tickX(filtered, {
                    clip: true,
                    x: 'time',
                    y: 'number',
                    fill: '#ddd',
                    stroke: '#ccc',
                    strokeWidth: 2.5,
                }),
            ],
        });
        // chord durations
        const plot2 = Plot.plot({
            insetRight: 10,
            width,
            height: 100,
            marginLeft: 60,
            marginTop: 0,
            marginBottom: 0,
            padding: 0,
            x: {
                label: null,
                domain: [minTime, maxTime],
                axis: false,
            },
            y: {
                ticks: [],
                label: 'durations (s)',
            },
            marks: [
                Plot.link(chordExtents, {
                    clip: true,
                    x1: (d) => d[0],
                    x2: (d) => d[1],
                    y: 0,
                }),
                Plot.text(chordExtents, {
                    clip: true,
                    x: (d) => d[0],
                    y: 0,
                    text: (d, i) => (d[1] - d[0]).toFixed(2),
                    dy: 10,
                    textAnchor: 'start',
                }),
            ],
        });
        // chord gaps
        const plot3 = Plot.plot({
            insetRight: 10,
            width,
            height: 100,
            marginLeft: 60,
            // marginRight: -10,
            marginBottom: 40,
            padding: 0,
            x: {
                label: 'Time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                ticks: [],
                label: 'gaps (s)',
            },
            marks: [
                Plot.link(chordGaps, {
                    clip: true,
                    x1: (d) => d[0],
                    x2: (d) => d[1],
                    y: 0,
                }),
                Plot.tickX(chordGaps, {
                    clip: true,
                    x: (d) => d[0],
                }),
                Plot.text(chordGaps, {
                    clip: true,
                    x: (d) => d[0],
                    y: 0,
                    text: (d, i) => (d[1] - d[0]).toFixed(2),
                    dx: 2,
                    dy: 10,
                    textAnchor: 'start',
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
        container.appendChild(plot2);
        container.appendChild(plot3);
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            pastSeconds,
            maxNoteDistance,
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
            pastSeconds = json.pastSeconds;
            maxNoteDistance = json.maxNoteDistance;
            // data
            notes = json.notes;
            draw();
        }
    };

    const saveToStorage = () => {
        if (notes.length > 0) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Play chords or short arpeggios with pauses inbetween. In the
        visualization below, you can then see how long the time between the
        first and last note of each chord/arpeggio was and how much time lies
        between consecutive chords/arpeggios.
    </p>
    <ExerciseDrawer>
        <p>1) Play a chord progression that is tricky for you.</p>
        <p>
            2) Play an arpeggio of this chord progression (with a pause after
            each).
        </p>
    </ExerciseDrawer>
    <div class="control">
        <label
            title="maximum distance between notes such that they still count as beloning to the same chord/arpeggio"
        >
            max. note distance
            <input
                type="number"
                bind:value="{maxNoteDistance}"
                on:change="{draw}"
                min="0.05"
                max="5"
                step="0.05"
            />
        </label>
        <label title="time in seconds for past notes to be shown">
            time
            <input
                type="number"
                bind:value="{pastSeconds}"
                on:change="{draw}"
                min="10"
                max="300"
                step="10"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} />
</main>
