<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Midi } from 'musicvis-lib';
    import { Chord, Note } from '@tonaljs/tonal';

    let width = 1000;
    let height = 200;
    let container;
    let midiDevices = [];
    // settings
    let pastChords = 5;
    let maxNoteDistance = 0.2;
    // domain knowledge
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    // data
    let firstTimeStamp = 0;
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
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const string = e.message.channel - 1;
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
            string,
            fret: e.note.number - tuningPitches[string],
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        // clustering to chords
        // TODO: move to mvlib
        let chords = [];
        let currentChord = [];
        for (const note of notes) {
            if (currentChord.length === 0) {
                // empty chord?
                currentChord.push(note);
            } else if (note.time - currentChord.at(-1).time < maxNoteDistance) {
                // add to current chord
                currentChord.push(note);
            } else {
                // start new chord
                chords.push(currentChord);
                currentChord = [note];
            }
        }
        chords.push(currentChord);

        // limit
        chords = chords.filter((d) => d.length > 1).slice(-pastChords);

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

        console.log(chords);

        // plot
        const cellSize = (width - 100) / 25;
        // const plot = Plot.plot({
        //     width,
        //     height,
        //     marginLeft: 60,
        //     marginBottom: 50,
        //     padding: 0,
        //     x: {
        //         // domain: d3.range(0, fretCount + 1),
        //         tickSize: 0,
        //     },
        //     y: {
        //         domain: d3.range(0, stringCount),
        //         tickFormat: (d) => tuningNotes[d] + ' ' + d,
        //         tickSize: 0,
        //     },
        //     color: {
        //         legend: true,
        //         marginLeft: 100,
        //         width: 400,
        //         type: 'categorical',
        //     },
        //     facet: {
        //         data: chords.flat(),
        //         x: 'chordId',
        //     },
        //     marks: [
        //         // //  frets
        //         Plot.ruleX(d3.range(0, fretCount + 1), {
        //             stroke: '#ddd',
        //             dx: cellSize / 2,
        //             fx: 'chordId',
        //         }),
        //         // strings
        //         Plot.ruleY(d3.range(0, stringCount), {
        //             stroke: '#ddd',
        //             strokeWidth: (d) => Math.sqrt(d + 1),
        //             fx: 'chordId',
        //         }),
        //         Plot.cell(chords.flat(), {
        //             x: 'fret',
        //             y: 'string',
        //             // fill: 'step',
        //             inset: 10,
        //             rx: '50%',
        //             // tip: true,
        //             fx: 'chordId',
        //         }),
        //     ],
        // });
        // container.textContent = '';
        // container.appendChild(plot);
        container.textContent = '';
        for (const chord of chords) {
            const frets = d3.extent(chord, (d) => d.fret);
            const plot = Plot.plot({
                width,
                height,
                marginLeft: 60,
                marginBottom: 50,
                padding: 0,
                x: {
                    // domain: d3.range(0, fretCount + 1),
                    domain: d3.range(
                        frets[0] - 1,
                        Math.max(frets[0] + 6, frets[1] + 2),
                        1,
                    ),
                    tickSize: 0,
                },
                y: {
                    domain: d3.range(0, stringCount),
                    tickFormat: (d) => tuningNotes[d],
                    tickSize: 0,
                },
                color: {
                    domain: d3.range(12),
                    legend: true,
                    marginLeft: 100,
                    width: 400,
                    type: 'categorical',
                    tickFormat: (d) => Midi.NOTE_NAMES[d],
                },
                r: {
                    legend: true,
                    domain: [0, 100],
                    range: [5, 10],
                },
                marks: [
                    // //  frets
                    Plot.ruleX(d3.range(0, fretCount + 1), {
                        stroke: '#ddd',
                        dx: cellSize / 2,
                    }),
                    // strings
                    Plot.ruleY(d3.range(0, stringCount), {
                        stroke: '#ddd',
                        strokeWidth: (d) => Math.sqrt(d + 1),
                    }),
                    // dots
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
                    // notes
                    Plot.dot(chord, {
                        x: 'fret',
                        y: 'string',
                        r: 'velocity',
                        fill: (d) => d.number % 12,
                        tip: true,
                    }),
                ],
            });
            container.appendChild(plot);
        }
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        firstTimeStamp = performance.now();
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
    <h2>Chord and Arpeggio Timing</h2>
    <p class="explanation">
        <!-- TODO: -->
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
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    notes = [];
                    firstTimeStamp = performance.now();
                }
            }}"
        >
            reset
        </button>
    </div>
</main>
