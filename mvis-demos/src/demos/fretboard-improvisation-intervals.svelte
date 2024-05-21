<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note, Scale } from '@tonaljs/tonal';
    import { Midi } from 'musicvis-lib';

    let width = 1000;
    let height = 280;
    let container;
    let midiDevices = [];
    // settings
    let root = 'A';
    let scale = 'minor pentatonic';
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
        const lastNote = notes.at(-1);
        // get interval positions
        const intervals = [];
        if (lastNote) {
            for (let string = 0; string < stringCount; string++) {
                for (let fret = 0; fret < fretCount + 1; fret++) {
                    const midi = tuningPitches[string] + fret;
                    // TODO: step should be in scale degrees between current and this note
                    let step = (midi - lastNote.number) % 12;
                    if (step < 0) {
                        step += 12;
                    }
                    intervals.push({
                        string,
                        fret,
                        step,
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
                tickFormat: (d) => tuningNotes[d] + ' ' + d,
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
                Plot.cell(intervals, {
                    x: 'fret',
                    y: 'string',
                    fill: 'step',
                    inset: 10,
                    rx: '50%',
                    tip: true,
                }),
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
    <h2>Fretboard Improvisation Intervals</h2>
    <p class="explanation"></p>
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
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    notes = [];
                    draw();
                }
            }}"
        >
            reset
        </button>
    </div>
</main>
