<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Utils } from 'musicvis-lib';
    import { toggleOnIcon, toggleOffIcon } from '../lib/icons.js';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import NoteCountInput from './common/note-count-input.svelte';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let container;
    let midiDevices = [];
    // settings
    let tempo = 120;
    let pastNoteCount = 10;
    let useDotted = true;
    // data
    let firstTimeStamp = 0;
    let notes = [];
    // domain knowledge
    // 𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯
    const possibilities = [
        // TODO: triplets? but maybe only when 3 detected?
        {
            name: 'double-whole',
            beats: 8,
            symbol: '𝅝_𝅝',
        },
        {
            name: 'dotted-whole',
            beats: 6,
            symbol: '𝅝.',
            dotted: true,
        },
        {
            name: 'whole',
            beats: 4,
            symbol: '𝅝',
        },
        {
            name: 'dotted-half',
            beats: 3,
            symbol: '𝅗𝅥.',
            dotted: true,
        },
        {
            name: 'half',
            beats: 2,
            symbol: '𝅗𝅥',
        },
        {
            name: 'dotted-quarter',
            beats: 1.5,
            symbol: '𝅘𝅥.',
            dotted: true,
        },
        {
            name: 'quarter',
            beats: 1,
            symbol: '𝅘𝅥',
        },
        {
            name: 'quarter-triplet',
            beats: 1 / 3,
            symbol: 't',
        },
        {
            name: 'dotted-eighth',
            beats: 0.75,
            symbol: '𝅘𝅥𝅮.',
            dotted: true,
        },
        {
            name: 'eighth',
            beats: 0.5,
            symbol: '𝅘𝅥𝅮',
        },
        {
            name: 'dotted-sixteenth',
            beats: 0.375,
            symbol: '𝅘𝅥𝅯.',
            dotted: true,
        },
        {
            name: 'sixteenth',
            beats: 0.25,
            symbol: '𝅘𝅥𝅯',
        },
        {
            name: 'thirtysecond',
            beats: 0.125,
            symbol: '𝅘𝅥𝅰',
        },
        {
            name: 'sixtyfourth',
            beats: 0.0625,
            symbol: '𝅘𝅥𝅱',
        },
    ];
    const possibilitiesNonDotted = possibilities.filter((d) => !d.dotted);

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

    const noteOn = async (e) => {
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = noteInSeconds;
        notes.push(note);
        draw();
    };

    /**
     * Draw visualization
     */
    const draw = () => {
        container.textContent = '';
        if (notes.length === 0) {
            return;
        }
        let quarter = Utils.bpmToSecondsPerBeat(tempo);
        const sliced = notes.slice(-(pastNoteCount + 1));
        const deltas = sliced.map((d, i) => (i === 0 ? 0 : d - sliced[i - 1]));
        const inBeats = deltas.map((d) => d / quarter);

        const poss = useDotted ? possibilities : possibilitiesNonDotted;
        const bestFit = inBeats.map((delta) => {
            const bestIndex = d3.minIndex(poss, (d) =>
                Math.abs(delta - d.beats),
            );
            const best = poss[bestIndex];
            return {
                ...best,
                beats: delta,
                offsetPercent: ((delta / best.beats) * 100).toFixed(),
            };
        });

        // plot
        const plot = Plot.plot({
            width,
            height: 100,
            marginLeft: 80,
            x: {
                label: '',
                domain: d3.range(1, pastNoteCount),
                ticks: [],
            },
            y: {
                domain: [1, 0],
                ticks: d3.range(3),
                tickFormat: (d) => ['note', '% offset'][d],
            },
            marks: [
                Plot.text(bestFit, {
                    text: 'symbol',
                    x: (d, i) => i,
                    y: 0,
                    fontSize: 40,
                }),
                // amount of beats
                // Plot.text(bestFit, {
                //     text: 'beats',
                //     x: (d, i) => i,
                //     y: 1,
                //     fontSize: 20,
                // }),
                // percent deviation
                Plot.text(bestFit, {
                    text: (d) => d.offsetPercent - 100,
                    x: (d, i) => i,
                    y: 1,
                    fontSize: 20,
                }),
            ],
        });
        container.appendChild(plot);
        // plot
        const plot2 = Plot.plot({
            width,
            height: 200,
            marginLeft: 80,
            x: {
                label: 'Note',
                domain: d3.range(1, pastNoteCount),
                tickSize: 0,
                ticks: [],
            },
            y: {
                domain: [0, 150],
                ticks: [0, 50, 100, 150],
            },
            marks: [
                Plot.barY(bestFit, {
                    x: (d, i) => i,
                    y: 'offsetPercent',
                    fill: '#ddd',
                }),
                Plot.ruleY([50, 150], { stroke: '#aaa' }),
                Plot.ruleY([100]),
            ],
        });
        container.appendChild(plot2);
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
        Set a tempo and start playing. The time between the notes you play will
        be displayed as note symbols, so you can see whether you play, for
        example, correct quarter notes.
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
        <button
            title="Use dotted notes? If not, the closest non-dotted note will be taken."
            on:click="{() => {
                useDotted = !useDotted;
                draw();
            }}"
        >
            dotted notes {useDotted ? toggleOnIcon : toggleOffIcon}
        </button>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear played notes"
            on:click="{() => {
                if (confirm('Clear notes?')) {
                    firstTimeStamp = performance.now();
                    notes = [];
                    draw();
                }
            }}"
        >
            reset
        </button>
        <MetronomeButton {tempo} accent="{4}" />
    </div>
    <PcKeyboardInput
        key=" "
        callback="{() => noteOn({ timestamp: performance.now() })}"
    />
</main>