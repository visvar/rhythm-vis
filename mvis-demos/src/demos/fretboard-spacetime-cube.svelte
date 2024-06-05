<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import { Note } from '@tonaljs/tonal';
    import 'aframe';
    import 'aframe-svelte';
    import { Midi } from 'musicvis-lib';

    /**
     * TODO:#
     * - improve text (anchor, baseline, side, wrappixels)
     *  - https://aframe.io/docs/1.5.0/components/text.html
     * - allow interaction to reset notes and scale time
     *  - https://aframe.io/docs/1.5.0/guides/building-a-basic-scene.html#event-listener-component-intermediate
     *  - support VR controllers?
     *      - https://aframe.io/docs/1.5.0/introduction/interactions-and-controllers.html
     * - use custom geometry?
     *  - https://aframe.io/docs/1.5.0/components/geometry.html
     */

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    // const stringColors = tuningNotes.map(()=>'#aaa')
    const stringColors = d3.schemeObservable10;
    let midiDevices = [];
    const timeFactor = 0.25;
    // data
    let notes = [];
    notes = d3.range(30).map(() => {
        const string = Math.floor(Math.random() * 6);
        const fret = Math.round(Math.random() * 24);
        const midiNr = tuningPitches[string] + fret;
        return {
            string,
            fret,
            time: Math.round(Math.random() * 60),
            note: Midi.NOTE_NAMES[midiNr % 12],
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
            note: Midi.NOTE_NAMES[e.note.number % 12],
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
    <!-- x is right, y is up, z is toward camera -->
    <a-scene>
        <a-sky color="white"></a-sky>
        <!-- text with explanation -->
        <a-entity
            text="value: {demoInfo.title}; color: #666; width: 5"
            position="-1.75 1.8 -1.5"
            scale=".35 .35 .35"
        ></a-entity>
        <a-entity
            text="value: Connect a MIDI guitar and start playing. Notes are positioned based on their string (forward), fret (right), and time (up). They are colored by string and labelled with note name and fret number.\n\nGo back in your browser to return to the main page.; color: #666; width: 5"
            position="-2 1.5 -1.5"
            scale=".25 .25 .25"
        ></a-entity>
        <!-- visualization container -->
        <a-box
            position="-1 .5 -1"
            rotation="0 0 0"
            scale=".1 .1 .1"
            visible="true"
            opacity="0"
        >
            <!-- fretboard -->
            {#each d3.range(stringCount) as string}
                <!-- strings -->
                <a-cylinder
                    position="{`${fretCount / 2} 0 ${string - 5}`}"
                    radius="{0.02 * (string / 6 + 1)}"
                    height="26"
                    rotation="0 0 90"
                    color="{stringColors[stringCount - string - 1]}"
                ></a-cylinder>
                <!-- string notes -->
                <a-entity
                    text="value: {tuningNotes[string]}; color: #666"
                    position="{`2.5 0 ${string - 5}`}"
                    scale="10 10 10"
                ></a-entity>
            {/each}
            {#each d3.range(fretCount + 1) as fret}
                <!-- frets -->
                <a-cylinder
                    position="{`${fret} 0 -2.5`}"
                    radius="{0.02}"
                    height="5"
                    rotation="90 0 0"
                    color="#ddd"
                ></a-cylinder>
                <!-- fret numbers -->
                <a-entity
                    text="value: {fret}; color: #666"
                    position="{`${fret + 4.5} 0 1`}"
                    scale="10 10 10"
                ></a-entity>
            {/each}
            <!-- inlays -->
            {#each [3, 5, 7, 9, 15, 17, 19, 21] as dot}
                <a-sphere
                    position="{dot - 0.5} 0 -2.5"
                    color="silver"
                    scale="0.25 0.1 0.25"
                ></a-sphere>
            {/each}
            {#each [12, 24] as dot}
                <a-sphere
                    position="{dot - 0.5} 0 -1.5"
                    color="silver"
                    scale="0.25 0.1 0.25"
                ></a-sphere>
                <a-sphere
                    position="{dot - 0.5} 0 -3.5"
                    color="silver"
                    scale="0.25 0.1 0.25"
                ></a-sphere>
            {/each}
            {#each d3.range(0, d3.max(notes, (d) => d.time) + 5, 5) as time}
                <!-- time axis -->
                <a-cylinder
                    position="{`${fretCount / 2} ${time * timeFactor + 1} -6`}"
                    radius="0.02"
                    height="26"
                    rotation="0 0 90"
                    color="#ccc"
                ></a-cylinder>
                <a-entity
                    text="value: {time}s; color: #666"
                    position="{`2.5 ${time * timeFactor + 1} -6 `}"
                    scale="10 10 10"
                ></a-entity>
            {/each}
            <!-- notes -->
            {#each notes as note, index}
                <a-box
                    position="{`${note.fret - 0.3} ${note.time * timeFactor + 1} ${note.string - 5}`}"
                    color="{stringColors[stringCount - note.string - 1]}"
                    opacity="0.5"
                    width="0.4"
                    height="0.4"
                    depth="0.4"
                >
                    <a-entity
                        text="value: {note.note}\n{note.fret}; color: #666"
                        position="2.35 0 0.201"
                        scale="5 5 5"
                    ></a-entity>
                </a-box>
            {/each}
        </a-box>
    </a-scene>
</main>
