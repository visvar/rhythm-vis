<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import NoteCountInput from './common/note-count-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { clamp } from '../lib/lib';
    import MidiInput from './common/midi-input.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 300;
    const random = () => (Math.random() - 0.5) * 0.5;
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    let container;
    // settings
    let pastNoteCount = 200;
    // data
    let firstTimeStamp = 0;
    let notes = [];

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const string = e.message.channel - 1;
        const fret = e.note.number - tuningPitches[string];
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
            string,
            fret,
            // add a little jitter
            stringJitter: string + random(),
            fretJitter: fret + random(),
        };
        notes.push(note);
        draw();
    };

    /**
     * Allow controlling vis with a MIDI knob
     * @param e MIDI controllchange event
     */
    const controlChange = (e) => {
        pastNoteCount = Math.round(clamp(e.rawValue * 2, 0, 200));
        draw();
    };

    const draw = () => {
        const data = notes.slice(-pastNoteCount);
        const cellSize = (width - 100) / 25;
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 50,
            padding: 0,
            x: {
                // domain: d3.range(0, fretCount + 1),
                domain: [-1, fretCount + 1.5],
                ticks: d3.range(0, fretCount + 1),
                tickSize: 0,
                label: 'fret',
            },
            y: {
                // domain: d3.range(0, stringCount),
                domain: [stringCount - 0.5, -0.5],
                tickFormat: (d) => tuningNotes[d],
                tickSize: 0,
                label: 'string',
            },
            color: {
                legend: true,
                marginLeft: 100,
                width: 400,
                scheme: 'viridis',
                reverse: true,
                domain: [0, pastNoteCount],
                label: 'note index',
            },
            r: {
                domain: [0, 127],
                range: [0, 5],
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
                // note scatterplot
                Plot.dot(data, {
                    x: 'fretJitter',
                    y: 'stringJitter',
                    // x: (d) => d.fretJitter,
                    // y: (d) => d.stringJitter - 1,
                    // dy: cellSize / 2,
                    fill: (d, i) => i,
                    r: 'velocity',
                    opacity: 0.5,
                }),
            ],
        });

        container.textContent = '';
        container.appendChild(plot);
    };

    onMount(draw);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI guitar and start playing. The fretboard scatterplot below
        shows you where you played, color-coded by time.
    </p>
    <div class="control">
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes callback="{draw}" />
        <!-- <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" /> -->
    </div>
    <MidiInput {noteOn} {controlChange} />
</main>
