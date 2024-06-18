<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Midi } from 'musicvis-lib';
    import { NOTE_COLORS } from '../lib/colors';
    import { Chord, Note } from '@tonaljs/tonal';
    import MidiInput from './common/midi-input.svelte';
    import { detectChords } from '../lib/chords';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let height = 200;
    let container;
    // settings
    let pastChords = 5;
    let maxFretSpan = 5;
    let maxNoteDistance = 0.1;
    // domain knowledge
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    // data
    let firstTimeStamp = 0;
    let notes = [];

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const string = e.message.channel - 1;
        const note = {
            time: noteInSeconds,
            number: e.note.number,
            velocity: e.rawVelocity,
            string,
            fret: e.note.number - tuningPitches[string],
            channel: e.message.channel,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        // clustering to chords
        let chords = detectChords(notes, maxNoteDistance);

        // remove notes that are too far
        chords = chords.map((notes) => {
            const nonOpen = notes.filter((n) => n.fret > 0);
            let minFret;
            if (nonOpen.length === 0) {
                // if all notes are open strings, wehave to take 0
                minFret = 0;
            } else {
                // else we take the lowest non-open fret
                minFret = d3.min(nonOpen, (d) => d.fret);
            }
            const maxFret = minFret + maxFretSpan;
            return notes.filter((d) => d.fret <= maxFret);
        });

        // limit
        chords = chords.filter((d) => d.length > 2).slice(-pastChords);

        // assign chord ID to all notes
        for (const [index, chord] of chords.entries()) {
            for (const note of chord) {
                note.chordId = index;
            }
        }

        const chordNames = chords.map((notes) => {
            let chordNotes = notes
                //  sort from C to B
                .sort((a, b) => a.number - b.number)
                // get name
                .map((d) => Note.fromMidiSharps(d.number));
            // remove duplicates
            chordNotes = [...new Set(chordNotes)];
            return Chord.detect(chordNotes);
        });

        // plot
        const width = ((height - 35) / 3) * (maxFretSpan + 1) + 50;
        const cellSize = (width - 100) / (maxFretSpan + 2);
        container.textContent = '';
        for (const [index, chord] of chords.entries()) {
            const nonOpen = chord.filter((n) => n.fret > 0);
            let minFret = 0;
            if (nonOpen.length > 0) {
                minFret = d3.min(nonOpen, (d) => d.fret);
            }
            const maxFret = minFret + maxFretSpan;
            const plot = Plot.plot({
                width,
                height,
                marginLeft: 40,
                marginRight: 10,
                marginBottom: 25,
                padding: 0,
                figure: true,
                subtitle: chordNames[index].join(', '),
                style: { textAlign: 'center' },
                x: {
                    domain: d3.range(
                        minFret === 0 ? 0 : minFret - 1,
                        maxFret + 2,
                    ),
                    label: '',
                    tickSize: 0,
                    tickPadding: 15,
                },
                y: {
                    domain: d3.range(0, stringCount),
                    tickFormat: (d) => tuningNotes[d],
                    label: '',
                    tickSize: 0,
                    tickPadding: 15,
                },
                color: {
                    domain: d3.range(12),
                    range: NOTE_COLORS.noteColormap,
                    legend: index === 0,
                    marginLeft: 100,
                    width: 600,
                    type: 'categorical',
                    tickFormat: (d) => Midi.NOTE_NAMES[d],
                },
                r: {
                    domain: [0, 1],
                    range: [5, 10],
                },
                marks: [
                    //  frets
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
                    // fretted notes
                    Plot.dot(
                        chord.filter((d) => d.fret > 0),
                        {
                            x: 'fret',
                            y: 'string',
                            r: 'velocity',
                            fill: (d) => d.number % 12,
                            tip: true,
                        },
                    ),
                    // open strings
                    Plot.dot(
                        chord.filter((d) => d.fret === 0),
                        {
                            x: minFret === 0 ? 0 : minFret - 1,
                            y: 'string',
                            r: 'velocity',
                            stroke: (d) => d.number % 12,
                            tip: true,
                        },
                    ),
                ],
            });
            container.appendChild(plot);
        }
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            pastChords,
            maxFretSpan,
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
            pastChords = json.pastChords;
            maxNoteDistance = json.maxNoteDistance;
            maxFretSpan = json.maxFretSpan;
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
        Play chords on a guitar and see the chord names and diagrams.
    </p>
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
        <label title="maximum distance between the lowest and highest fret">
            max. fret span
            <input
                type="number"
                bind:value="{maxFretSpan}"
                on:change="{draw}"
                min="5"
                max="25"
                step="1"
            />
        </label>
        <label title="The number of played chords that is displayed">
            chord count
            <input
                type="number"
                bind:value="{pastChords}"
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
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} />
</main>
