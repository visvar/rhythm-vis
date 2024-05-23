<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import { getCs, clamp } from '../lib/lib';
    import { Midi } from 'musicvis-lib';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';

    let width = 1200;
    let height = 280;
    const minPitch = 21;
    const maxPitch = 108;
    let container;
    let midiDevices = [];
    // settings
    let pastNoteCount = 500;
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
                device.addListener('controlchange', controlChange);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

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
        console.log(counts);
        const maxCount = d3.max(counts, (d) => d[1].length);
        console.log(maxCount);
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: d3.range(minPitch, maxPitch),
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
            y: {},
            marks: [
                Plot.ruleX(getCs(minPitch, maxPitch), {
                    stroke: '#ddd',
                }),
                Plot.ruleY([0], {
                    stroke: '#ddd',
                }),
                // background bars
                Plot.barY(
                    d3.range(minPitch, maxPitch).filter((d) => Midi.isSharp(d)),
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
                            // fill: (d) => console.log(d),
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

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            notes,
            pastNoteCount,
        };
        downloadJsonFile('keyboard-histogram', data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            notes = json.notes;
            pastNoteCount = json.pastNoteCount;
            draw();
        }
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
    <h2>Keyboard Histogram</h2>
    <p class="explanation">
        Connect a MIDI keyboard and start playing. The heatmap below shows how
        often you played each keyboard key.
    </p>
    <div class="control">
        <label>
            number of notes
            <input
                type="number"
                bind:value="{pastNoteCount}"
                min="0"
                max="250"
                step="1"
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
                    draw();
                }
            }}"
        >
            reset
        </button>
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
    </div>
</main>
