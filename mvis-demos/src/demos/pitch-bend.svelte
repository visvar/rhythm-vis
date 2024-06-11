<script>
    import { onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import { throttle } from 'underscore';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import MidiInput from './common/midi-input.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 700;
    let container;
    // settings
    let pastTime = 10;
    // data
    let firstTimeStamp = 0;
    let bendValues = [];

    const pitchBend = (e) => {
        if (bendValues.length === 0) {
            firstTimeStamp = e.timestamp;
        }
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
                    clip: true,
                    // smooth a bit
                    curve: 'basis',
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
        downloadJsonFile(demoInfo.id, data);
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

    onMount(draw);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
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
        <ResetNotesButton bind:notes="{bendValues}" callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
    </div>
    <MidiInput {pitchBend} />
</main>
