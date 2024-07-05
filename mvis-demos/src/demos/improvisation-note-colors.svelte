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
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 400;
    let container;
    // settings
    let root = 'A';
    let pastNoteCount = 50;
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
            name: e.note.name,
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
        const scale1 = new Set(Scale.get(`${root} minor`).notes);
        const scale2 = new Set(Scale.get(`${root} minor blues`).notes);
        const scale3 = new Set(Scale.get(`${root} minor pentatonic`).notes);
        const colorMap = Midi.NOTE_NAMES_FLAT.map((note) => {
            if (note === root) {
                return '#1B5E20';
            } else if (scale3.has(note)) {
                return '#689F38';
            } else if (scale2.has(note)) {
                return 'cornflowerblue';
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
            },
            y: {},
            color: {
                legend: true,
                domain: d3.range(12),
                range: colorMap,
                tickFormat: (d) => Midi.NOTE_NAMES[d],
                marginLeft: 290,
            },
            marks: [
                Plot.ruleY([0], {
                    stroke: '#ddd',
                }),
                // data
                Plot.barY(limited, {
                    x: (d, i) => i,
                    y: 'duration',
                    fill: (d) => d.number % 12,
                    inset: 0.5,
                    rx: 4,
                    tip: true,
                }),
                Plot.text(limited, {
                    x: (d, i) => i,
                    y: 'duration',
                    text: 'name',
                    fontSize: 14,
                    dy: -10,
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
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            if (notes.length > 0) {
                saveToStorage();
            }
            root = json.root;
            pastNoteCount = json.pastNoteCount;
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
        Notes that you play are shown as bars. The color shows which scale
        subset a note belongs to. The bars' height encodes the notes' durations.
    </p>
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
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    saveToStorage();
                    notes = [];
                    openNoteMap = new Map();
                    draw();
                }
            }}"
        >
            reset
        </button>
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} {noteOff} {controlChange} />
</main>
