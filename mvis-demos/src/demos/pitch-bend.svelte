<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import * as Plot from '@observablehq/plot';
    import { throttle } from 'underscore';

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
    </div>
</main>
