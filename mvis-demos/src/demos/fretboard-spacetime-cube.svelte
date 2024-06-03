<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import NoteCountInput from './common/note-count-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import 'aframe';
    import 'aframe-svelte';
    import { log } from 'aframe';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 300;
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    let container;
    let midiDevices = [];
    const timeFactor = 0.05;
    // settings
    let pastNoteCount = 200;
    // data
    let notes = [];
    notes = d3.range(20).map(() => {
        return {
            string: Math.floor(Math.random() * 6),
            fret: Math.round(Math.random() * 24),
            time: Math.round(Math.random() * 30),
        };
    });
    console.log(notes);

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
        const fret = e.note.number - tuningPitches[string];
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: e.timestamp,
            channel: e.message.channel,
            string,
            fret,
        };
        notes = [...notes, note];
        draw();
    };

    const draw = () => {
        // const data = notes.slice(-pastNoteCount);
        // const cellSize = (width - 100) / 25;
        // const plot = Plot.plot({
        //     width,
        //     height,
        //     marginLeft: 60,
        //     marginBottom: 50,
        //     padding: 0,
        //     x: {
        //         // domain: d3.range(0, fretCount + 1),
        //         domain: [-1, fretCount + 1.5],
        //         ticks: d3.range(0, fretCount + 1),
        //         tickSize: 0,
        //         label: 'fret',
        //     },
        //     y: {
        //         // domain: d3.range(0, stringCount),
        //         domain: [stringCount - 0.5, 0.5],
        //         tickFormat: (d) => tuningNotes[d],
        //         tickSize: 0,
        //         label: 'string',
        //     },
        //     color: {
        //         legend: true,
        //         marginLeft: 100,
        //         width: 400,
        //         scheme: 'viridis',
        //         reverse: true,
        //         domain: [0, pastNoteCount],
        //         label: 'note index',
        //     },
        //     r: {
        //         domain: [0, 127],
        //         range: [0, 5],
        //     },
        //     marks: [
        //         // frets
        //         Plot.ruleX(d3.range(0, fretCount + 1), {
        //             stroke: '#ddd',
        //             dx: cellSize / 2,
        //         }),
        //         // strings
        //         Plot.ruleY(d3.range(0, stringCount), {
        //             stroke: '#ddd',
        //             strokeWidth: (d) => Math.sqrt(d + 1),
        //         }),
        //         // inlay dots
        //         Plot.dot([3, 5, 7, 9, 15, 17, 19, 21], {
        //             x: (d) => d,
        //             y: 2,
        //             dy: cellSize / 2,
        //             fill: '#ddd',
        //             r: 8,
        //         }),
        //         Plot.dot([12, 12, 24, 24], {
        //             x: (d) => d,
        //             y: (d, i) => (i % 2 === 0 ? 1 : 3),
        //             dy: cellSize / 2,
        //             fill: '#ddd',
        //             r: 8,
        //         }),
        //         // note scatterplot
        //         Plot.dot(data, {
        //             x: 'fretJitter',
        //             y: 'stringJitter',
        //             // x: (d) => d.fretJitter,
        //             // y: (d) => d.stringJitter - 1,
        //             // dy: cellSize / 2,
        //             fill: (d, i) => i,
        //             r: 'velocity',
        //         }),
        //     ],
        // });
        // container.textContent = '';
        // container.appendChild(plot);
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
        Connect a MIDI guitar and start playing. The fretboard scatterplot below
        shows you where you played, color-coded by time.
    </p>
    <div class="control">
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
    </div>
    <div class="visualization" bind:this="{container}">
        <a-scene>
            <a-sky color="white"></a-sky>
            <!-- x is right, y is up, z is toward camera -->
            <a-box
                position="0.5 0 0"
                color="red"
                width="1"
                height="0.1"
                depth="0.1"
            ></a-box>
            <a-box
                position="0 0.5 0"
                color="green"
                width="0.1"
                height="1"
                depth="0.1"
            ></a-box>
            <a-box
                position="0 0 0.5"
                color="blue"
                width="0.1"
                height="0.1"
                depth="1"
            ></a-box>
            <a-box
                position="0 .5 -2"
                rotation="0 0 0"
                scale=".1 .1 .1"
                visible="true"
            >
                <!-- fretboard -->
                {#each d3.range(stringCount) as string}
                    <a-cylinder
                        position="{`${fretCount / 2} 0 ${string - 5}`}"
                        radius="{0.02 * (string / 6 + 1)}"
                        height="26"
                        rotation="0 0 90"
                        color="#aaa"
                    ></a-cylinder>
                {/each}
                {#each d3.range(fretCount + 1) as fret}
                    <a-cylinder
                        position="{`${fret} 0 -2.5`}"
                        radius="{0.02}"
                        height="5"
                        rotation="90 0 0"
                        color="#ddd"
                    ></a-cylinder>
                    <!-- fret numbers -->
                    <a-entity
                        text="value: {fret}; color: #000"
                        position="{`${fret + 4} 0 1`}"
                        scale="10 10 10"
                    ></a-entity>
                {/each}
                <!-- inlays -->
                {#each [3, 5, 7, 9, 15, 17, 19, 21] as dot}
                    <a-sphere
                        position="{dot - 0.5} 0 -2.5"
                        color="red"
                        scale="0.25 0.025 0.25"
                    ></a-sphere>
                {/each}
                {#each [12, 24] as dot}
                    <a-sphere
                        position="{dot - 0.5} 0 -1.5"
                        color="red"
                        scale="0.25 0.025 0.25"
                    ></a-sphere>
                    <a-sphere
                        position="{dot - 0.5} 0 -3.5"
                        color="red"
                        scale="0.25 0.025 0.25"
                    ></a-sphere>
                {/each}
                <!-- notes -->
                {#each notes as note, index}
                    <a-box
                        position="{`${note.fret - 0.3} ${index * timeFactor} ${note.string - 5}`}"
                        color="gray"
                        width="0.5"
                        height="0.5"
                        depth="0.5"
                    ></a-box>
                {/each}
            </a-box>
        </a-scene>
    </div>
    <div class="control">
        <ResetNotesButton bind:notes callback="{draw}" />
        <!-- <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" /> -->
    </div>
</main>

<style>
    .control {
        z-index: 10000;
    }
</style>
