<script>
    import { onDestroy, onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import { throttle } from 'underscore';
    import ResetNotesButton from '../common/reset-notes-button.svelte';
    import MidiInput from '../common/midi-input.svelte';
    import ImportExportButton from '../common/import-export-button.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import HistoryButton from '../common/history-button.svelte';
    import ExerciseDrawer from '../common/exercise-drawer.svelte';
    import RatingButton from '../common/rating-button.svelte';
    import ShareConfigButton from '../common/share-config-button.svelte';

    /**
     * contains the app meta information defined in App.js
     */
    export let appInfo;

    let width = 900;
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

    onMount(draw);

    /**
     * Used for exporting and for automatic saving
     */
    const getExportData = () => {
        return {
            pastTime,
            firstTimeStamp,
            bendValues,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        saveToStorage();
        pastTime = json.pastTime;
        firstTimeStamp = json.firstTimeStamp;
        bendValues = json.bendValues;
        draw();
    };

    const saveToStorage = () => {
        if (
            bendValues.length > 0
            // && JSON.stringify(bendValues) !== JSON.stringify(example.bendValues)
        ) {
            localStorageAddRecording(appInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="app">
    <h2>{appInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI device and play pitch bends or vibratos. The line chart
        below shows how far you bend up and down over time.
    </p>
    <ExerciseDrawer>
        <p>1) Play a bend by one semitone (for example, A to A#).</p>
        <p>2) Play a bend by two semitones (for example, A to B).</p>
        <p>3) Play a vibrato where you always bend by one semitone.</p>
        <p>
            4) Play a vibrato and then a second one with twice the frequency of
            modulation.
        </p>
        <p>
            5) Slide from one note to a much higher one as smoothly as possible.
        </p>
    </ExerciseDrawer>
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
        <ResetNotesButton
            bind:notes="{bendValues}"
            {saveToStorage}
            callback="{draw}"
        />
        <ImportExportButton {loadData} {getExportData} appId="{appInfo.id}" />
        <HistoryButton appId="{appInfo.id}" {loadData} />
        <ShareConfigButton {getExportData} {loadData} appId="{appInfo.id}" />
    </div>
    <RatingButton appId="{appInfo.id}" />
    <MidiInput {pitchBend} />
</main>
