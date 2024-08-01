<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import { getCs, clamp } from '../lib/lib';
    import { Midi } from 'musicvis-lib';
    import NoteCountInput from './common/note-count-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
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
    let height = 600;
    const minPitch = 21;
    const maxPitch = 108;
    let container;
    // settings
    let pastNoteCount = 500;
    // data
    let notes = [];

    const noteOn = (e) => {
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: e.timestamp,
            channel: e.message.channel,
        };
        notes.push(note);
        draw();
    };

    const controlChange = (e) => {
        const clamped = clamp(e.rawValue * 2, 20, 250);
        pastNoteCount = clamped;
        draw();
    };

    const draw = () => {
        const limited = notes.slice(-pastNoteCount);
        const counts = d3.groups(limited, (d) => d.number);
        const maxCount = d3.max(counts, (d) => d[1].length);
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: d3.range(minPitch, maxPitch + 1),
                tickFormat: (d) => {
                    if (Midi.isSharp(d)) {
                        return '';
                    } else if (d % 12 === 0) {
                        return '\n' + Note.fromMidiSharps(d);
                    } else {
                        return Note.fromMidiSharps(d).slice(0, -1);
                    }
                },
            },
            y: {
                interval: 1,
            },
            marks: [
                Plot.ruleX(getCs(minPitch, maxPitch + 1), {
                    stroke: '#ddd',
                }),
                Plot.ruleY([0], {
                    stroke: '#ddd',
                }),
                // background bars
                Plot.barY(
                    d3
                        .range(minPitch, maxPitch + 1)
                        .filter((d) => Midi.isSharp(d)),
                    {
                        x: (d) => d,
                        y: () => maxCount,
                        fill: '#f8f8f8',
                        inset: 0.5,
                    },
                ),
                // data
                Plot.barY(
                    limited,
                    Plot.groupX(
                        { y: 'count' },
                        {
                            x: 'number',
                            fill: (d) =>
                                Midi.isSharp(d.number) ? '#444' : '#ccc',
                            inset: 0.5,
                            rx: 4,
                            tip: true,
                        },
                    ),
                ),
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
            pastNoteCount,
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
            pastNoteCount = json.pastNoteCount;
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
        Connect a MIDI keyboard and start playing. The heatmap below shows how
        often you played each keyboard key.
    </p>
    <div class="control">
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} {controlChange} />
</main>
