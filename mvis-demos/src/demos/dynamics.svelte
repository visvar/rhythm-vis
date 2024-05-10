<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import * as Plot from '@observablehq/plot';

    let width = 1000;
    let height = 600;
    let container;
    let midiDevices = [];
    // see https://en.wikipedia.org/wiki/Dynamics_(music)
    const velocitiesLogic = new Map([
        [0, 'silent'],
        [16, 'ppp'],
        [32, 'pp'],
        [48, 'p'],
        [64, 'mp'],
        [80, 'mf'],
        [96, 'f'],
        [112, 'ff'],
        [127, 'fff'],
    ]);
    const velocitiesFinale = new Map([
        [0, 'silent'],
        [10, 'pppp'],
        [23, 'ppp'],
        [36, 'pp'],
        [49, 'p'],
        [62, 'mp'],
        [75, 'mf'],
        [88, 'f'],
        [101, 'ff'],
        [114, 'fff'],
        [127, 'ffff'],
    ]);
    const velocitiesMuseScore = new Map([
        [0, 'silent'],
        [5, 'ppppp'],
        [10, 'pppp'],
        [16, 'ppp'],
        [33, 'pp'],
        [49, 'p'],
        [64, 'mp'],
        [80, 'mf'],
        [96, 'f'],
        [112, 'ff'],
        [126, 'fff'],
        [127, 'ffff'],
    ]);
    const velocities = velocitiesLogic;

    // settings
    let isBinning = true;
    let barLimit = 50;
    // data
    let noteVelocities = [];

    const onMidiEnabled = () => {
        console.log('MIDI enabled');
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
        noteVelocities.push(e.rawVelocity);
        draw();
    };

    const draw = () => {
        console.log('draw');
        // round bars' height to make view clearer
        let binnedVelocities = noteVelocities;
        if (isBinning) {
            binnedVelocities = noteVelocities.map((d) => {
                for (const v of velocities.keys()) {
                    if (d <= v) {
                        return v;
                    }
                }
            });
        }
        const rules = [...velocities.keys()];
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 45,
            marginRight: 1,
            x: {
                axis: false,
            },
            y: {
                ticks: rules,
                tickFormat: (d) => velocities.get(d),
                domain: [0, 128],
                tickSize: 0,
            },
            marks: [
                Plot.barY(binnedVelocities.slice(-barLimit), {
                    x: (d, i) => i,
                    y: (d) => d,
                    fill: '#ddd',
                    inset: 0,
                    dx: 0.5,
                }),
                Plot.ruleY(rules, { stroke: '#888' }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
    };

    const exportData = () => {
        const data = {
            isBinning,
            barLimit,
            noteVelocities,
        };
        const json = JSON.stringify(data, undefined, 2);
        const blob = new Blob([json], {
            type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, 'tempo-drift.json');
    };

    const importData = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const json = JSON.parse(text);
        if (
            noteVelocities.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            isBinning = json.isBinning;
            barLimit = json.barLimit;
            noteVelocities = json.noteVelocities;
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
    <h2>Dynamics</h2>
    <p class="explanation">
        Connect a MIDI instrument (currently {midiDevices.length} connected) and
        start playing. The loudness of each note will be shown as a bar. Bar heights
        are either exact or rounded to the
        <a href="https://en.wikipedia.org/wiki/Dynamics_(music)"
            >closest rough dynamics</a
        >, for example a forte.
    </p>
    <div class="control">
        <button
            title="You can change between seeing exact bar heights and binned (rounded) heights."
            on:click="{() => {
                isBinning = !isBinning;
                draw();
            }}"
        >
            binning is {isBinning ? 'on' : 'off'}
        </button>
        <label title="The number of most recent notes that are shown as bars.">
            bars
            <input
                type="number"
                bind:value="{barLimit}"
                on:change="{draw}"
                step="25"
                min="25"
                max="1000"
                style="width: 55px"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    noteVelocities = [];
                    draw();
                }
            }}"
        >
            reset
        </button>
        <button title="Export all data and settings" on:click="{exportData}">
            export
        </button>
        <button
            title="Export all data and settings"
            on:click="{() => document.querySelector('#file-input').click()}"
        >
            import
        </button>
        <input
            type="file"
            on:input="{importData}"
            id="file-input"
            style="display: none"
        />
    </div>
</main>

<style>
    div :global(text) {
        font-size: 16px;
    }
</style>