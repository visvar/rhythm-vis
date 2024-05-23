<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as Plot from '@observablehq/plot';
    import { throttle } from 'underscore';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';

    let width = 1200;
    let height = 700;
    let container;
    let midiDevices = [];
    // settings
    let pastTime = 10;
    // data
    let firstTimeStamp = 0;
    let bendValues = [];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('pitchbend', pitchBend);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

    const pitchBend = (e) => {
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const bend = {
            value: e.value,
            time: noteInSeconds,
        };
        bendValues.push(bend);
        drawThrottled();
    };

    const draw = () => {
        const now = (performance.now() - firstTimeStamp) / 1000;
        const minTime = now - pastTime;
        const limited = bendValues.filter((d) => d.time > minTime);
        // TODO: split into multiple lines if time between bends values is larger than some threshold
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: [minTime, now],
                label: 'time in seconds',
            },
            y: {
                domain: [-1, 1],
                label: 'bend value',
            },
            marks: [
                Plot.ruleY([-1, -0.5, 0, 0.5, 1], {
                    stroke: '#ddd',
                }),
                Plot.ruleY([0]),
                // data
                Plot.line(limited, {
                    x: 'time',
                    y: 'value',
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
    };

    const drawThrottled = throttle(draw, 33);

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            pastTime,
            firstTimeStamp,
            bendValues,
        };
        downloadJsonFile('pitch-bend', data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            bendValues.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            pastTime = json.pastTime;
            firstTimeStamp = json.firstTimeStamp;
            bendValues = json.bendValues;
            draw();
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
    <h2>Pitch Bend</h2>
    <p class="explanation">
        Connect a MIDI device and play pitch bends or vibratos. The line chart
        below shows how far you bend up and down over time
    </p>
    <div class="control">
        <label>
            past seconds
            <input
                type="number"
                bind:value="{pastTime}"
                min="5"
                max="60"
                step="5"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    bendValues = [];
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
