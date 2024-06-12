<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Scale } from '@tonaljs/tonal';
    import { clamp } from '../lib/lib';
    import { Midi } from 'musicvis-lib';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import NoteCountInput from './common/note-count-input.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import MidiInput from './common/midi-input.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 280;
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

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            // data
            root,
            notes,
            pastNoteCount,
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
            root = json.root;
            // data
            notes = json.notes;
            pastNoteCount = json.pastNoteCount;
            draw();
        }
    };

    onMount(draw);
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
                    notes = [];
                    openNoteMap = new Map();
                    draw();
                }
            }}"
        >
            reset
        </button>
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
    </div>
    <MidiInput {noteOn} {noteOff} {controlChange} />
</main>
