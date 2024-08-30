<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Scale } from '@tonaljs/tonal';
    import { clamp } from '../lib/lib';
    import { Midi } from 'musicvis-lib';
    import NoteCountInput from './common/note-count-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import HistoryButton from './common/history-button.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import RatingButton from './common/rating-button.svelte';
    import ToggleButton from './common/toggle-button.svelte';
    import ShareConfigButton from './common/share-config-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 900;
    let height = 300;
    let container;
    // settings
    // let root = 'A';
    let root = 'C';
    let pastNoteCount = 50;
    let showDuration = false;
    // data
    let notes = [];
    let firstTimeStamp;
    let openNoteMap = new Map();

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = {
            name: e.note.name + (e.note.accidental ?? ''),
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
            duration: 0,
        };
        // fix old note if its end was missed
        if (openNoteMap.has(e.note.number)) {
            const oldNote = openNoteMap.get(e.note.number);
            if (oldNote.end === undefined) {
                oldNote.end = noteInSeconds;
            }
        }
        notes.push(note);
        openNoteMap.set(e.note.number, note);
        draw();
    };

    const noteOff = (e) => {
        if (openNoteMap.has(e.note.number)) {
            const note = openNoteMap.get(e.note.number);
            const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
            note.end = noteInSeconds;
            note.duration = note.end - note.time;
        }
        draw();
    };

    const controlChange = (e) => {
        const clamped = clamp(e.rawValue * 2, 20, 250);
        pastNoteCount = clamped;
        draw();
    };

    const draw = () => {
        // const scale1 = new Set(Scale.get(`${root} minor`).notes);
        // const scale2 = new Set(Scale.get(`${root} minor blues`).notes);
        // const scale3 = new Set(Scale.get(`${root} minor pentatonic`).notes);
        const scale1 = new Set(Scale.get(`${root} major`).notes);
        const scale3 = new Set(Scale.get(`${root} major pentatonic`).notes);
        const colorMap = Midi.NOTE_NAMES_FLAT.map((note) => {
            if (note === root) {
                return '#1B5E20';
            } else if (scale3.has(note)) {
                return '#689F38';
                // } else if (scale2.has(note)) {
                //     return 'cornflowerblue';
            } else if (scale1.has(note)) {
                return '#D4E157';
            } else {
                return 'lightgray';
            }
        });
        const limited = notes.slice(-pastNoteCount);
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                axis: false,
                // domain: [0, pastNoteCount],
            },
            y: {
                axis: showDuration,
                domain: [0, 1],
                label: 'duration in seconds',
            },
            color: {
                legend: true,
                domain: d3.range(12),
                range: colorMap,
                tickFormat: (d) => Midi.NOTE_NAMES[d],
                marginLeft: 290,
            },
            opacity: {
                domain: [0, 127],
                range: [0.2, 1],
            },
            marks: [
                Plot.ruleY([0], {
                    stroke: '#ddd',
                }),
                // data
                Plot.barY(limited, {
                    x: (d, i) => i,
                    y: showDuration ? 'duration' : 1,
                    fill: (d) => d.number % 12,
                    // opacity: (d) => d.velocity,
                    inset: 0.5,
                    rx: 4,
                    tip: true,
                }),
                Plot.text(limited, {
                    x: (d, i) => i,
                    y: 0,
                    text: 'name',
                    fontSize: 12,
                    dy: 16,
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            root,
            pastNoteCount,
            // data
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        if (notes.length > 0) {
            saveToStorage();
        }
        root = json.root;
        pastNoteCount = json.pastNoteCount;
        // data
        notes = json.notes;
        draw();
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
        Notes that you play are shown as bars. The color shows which scale
        subset a note belongs to. The bars' height encodes the notes' durations.
    </p>
    <ExerciseDrawer>
        <p>
            1) Improvise something in the scale of A minor pentatonic. Check if
            you only used this scale's notes using the colors.
        </p>
        <p>
            2) Improvise in A minor blues, see how often and when you used the
            blue note (D#).
        </p>
    </ExerciseDrawer>
    <div class="control">
        <label>
            root note
            <select bind:value="{root}" on:change="{draw}">
                {#each Midi.NOTE_NAMES as n}
                    <option value="{n}">{n}</option>
                {/each}
            </select>
        </label>
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
        <ToggleButton
            bind:checked="{showDuration}"
            label="duration"
            title="Show duration in the bar's height?"
            callback="{draw}"
        />
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton
            bind:notes
            {saveToStorage}
            callback="{() => {
                openNoteMap = new Map();
                draw();
            }}"
        />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <HistoryButton demoId="{demoInfo.id}" {loadData} />
        <ShareConfigButton {getExportData} {loadData} />
    </div>
    <RatingButton appId="{demoInfo.id}" />
    <MidiInput {noteOn} {noteOff} {controlChange} />
</main>
