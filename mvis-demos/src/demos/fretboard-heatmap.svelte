<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import NoteCountInput from './common/note-count-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 280;
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    let container;
    let midiDevices = [];
    // settings
    let pastNoteCount = 200;
    // data
    let notes = [];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('noteon', noteOn);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

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
        // TODO: filter notes which are too close together
        // TODO: filter notes with low velocity

        const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
        const data = notes.slice(-pastNoteCount);
        const cellSize = (width - 100) / 25;
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: d3.range(0, fretCount + 1),
                ticks: d3.range(0, fretCount + 1),
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
                scheme: 'blues',
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
                // heatmap
                Plot.cell(
                    data,
                    Plot.group(
                        { fill: 'count' },
                        {
                            x: 'fret',
                            y: 'string',
                            fill: 'count',
                            inset: 5,
                            rx: '50%',
                            tip: true,
                        },
                    ),
                ),
            ],
        });

        container.textContent = '';
        container.appendChild(plot);
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        draw();
    });

    onDestroy(() => {
        // remove MIDI listeners to avoid duplicate calls and improve performance
        for (const input of WebMidi.inputs) {
            input.removeListener();
        }
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI guitar and start playing. The heatmap below shows how
        often you played each fretboard position.
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
</main>
