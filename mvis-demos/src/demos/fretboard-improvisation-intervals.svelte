<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note, Scale } from '@tonaljs/tonal';
    import { Midi } from 'musicvis-lib';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import { toggleOnIcon, toggleOffIcon } from '../lib/icons.js';
    import example from '../example-recordings/fretboard-improvisation-intervals.json';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import ToggleButton from './common/toggle-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 280;
    let container;
    // settings
    let root = 'A';
    let scale = 'minor pentatonic';
    let showNames = false;
    let limitFrets = false;
    // data
    let notes = [];
    // domain knowledge
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    const noteNames = Midi.NOTE_NAMES_FLAT;
    const scales = Scale.names();

    const noteOn = (e) => {
        const string = e.message.channel - 1;
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: e.timestamp,
            channel: e.message.channel,
            string,
            fret: e.note.number - tuningPitches[string],
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        const lastNote = notes.at(-1);

        const data = [];
        if (lastNote) {
            const lastNoteChroma = lastNote.number % 12;
            // get scale intervals
            const scaleInfo = Scale.get(`${root} ${scale}`);
            const scaleNotes = new Map(
                scaleInfo.notes.map((note, i) => {
                    // note chroma from 0 to 11 (C to B)
                    const chroma = noteNames.indexOf(note);
                    let offset = chroma - lastNoteChroma;
                    offset = offset >= 0 ? offset : offset + 12;
                    const info = {
                        name: note,
                        chroma,
                        interval: scaleInfo.intervals[i],
                        degree: i,
                        offset,
                    };
                    return [chroma, info];
                }),
            );
            const lastNoteDegree = scaleNotes.get(lastNote.number % 12).degree;
            // if frets are limited to within reach
            let minFret = 0;
            let maxFret = fretCount;
            if (limitFrets) {
                minFret = lastNote.fret - 4;
                maxFret = lastNote.fret + 4;
            }
            // get interval positions
            for (let string = 0; string < stringCount; string++) {
                for (let fret = minFret; fret < maxFret + 1; fret++) {
                    const midi = (tuningPitches[string] + fret) % 12;
                    // only consider notes in scale
                    if (!scaleNotes.has(midi)) {
                        continue;
                    }
                    const n = scaleNotes.get(midi);
                    const degStep = n.degree - lastNoteDegree;
                    data.push({
                        ...n,
                        string,
                        fret,
                        step: n.offset,
                        degreeStep:
                            degStep >= 0 ? degStep : degStep + scaleNotes.size,
                    });
                }
            }
        }

        const cellSize = (width - 100) / 25;
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: d3.range(0, fretCount + 1),
                tickSize: 0,
            },
            y: {
                domain: d3.range(0, stringCount),
                tickFormat: (d) => tuningNotes[d],
                tickSize: 0,
            },
            color: {
                legend: true,
                marginLeft: 100,
                width: 400,
                // scheme: 'sinebow',
                type: 'categorical',
                // domain: [0, 3, 4, 7],
                // range: ['black', 'red'],
            },
            marks: [
                // frets
                Plot.ruleX(d3.range(0, fretCount + 1), {
                    stroke: '#ddd',
                    dx: cellSize / 2,
                }),
                // strings
                Plot.ruleY(d3.range(0, stringCount), {
                    stroke: '#ddd',
                    strokeWidth: (d) => Math.sqrt(d + 1),
                }),
                // inlay dots
                Plot.dot([3, 5, 7, 9, 15, 17, 19, 21], {
                    x: (d) => d,
                    y: 2,
                    dy: cellSize / 2,
                    fill: '#ddd',
                    r: 8,
                }),
                Plot.dot([12, 12, 24, 24], {
                    x: (d) => d,
                    y: (d, i) => (i % 2 === 0 ? 1 : 3),
                    dy: cellSize / 2,
                    fill: '#ddd',
                    r: 8,
                }),
                // last note
                lastNote
                    ? Plot.cell([lastNote], {
                          x: 'fret',
                          y: 'string',
                          fill: 'black',
                          tip: true,
                          inset: 5,
                          rx: 5,
                      })
                    : null,
                // notes
                Plot.cell(data, {
                    x: 'fret',
                    y: 'string',
                    fill: 'degreeStep',
                    inset: 10,
                    rx: '50%',
                    tip: true,
                }),
                Plot.text(data, {
                    x: 'fret',
                    y: 'string',
                    fill: 'white',
                    text: showNames ? 'name' : 'degreeStep',
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
            scale,
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
            scale = json.scale;
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
        Each time you play a note, the fretboard below shows you how far each
        note of the scale is away from the note you just played.
    </p>
    <div class="control">
        <label>
            scale
            <select bind:value="{root}" on:change="{draw}">
                {#each noteNames as n}
                    <option value="{n}">{n}</option>
                {/each}
            </select>
            <select bind:value="{scale}" on:change="{draw}">
                {#each scales as s}
                    <option value="{s}">{s}</option>
                {/each}
            </select>
        </label>
        <ToggleButton
            bind:checked="{showNames}"
            title="Toggle between note names and scale steps"
            label="note names"
            callback="{draw}"
        />
        <ToggleButton
            bind:checked="{limitFrets}"
            title="Limit frets to those that are in reach"
            label="limit frets"
            callback="{draw}"
        />
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
