<script>
    import { onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import RatingButton from './common/rating-button.svelte';
    import MidiInput from './common/midi-input.svelte';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import TouchInput from './common/touch-input.svelte';
    import { secondsPerBeatToBpm } from '../lib/lib';
    import ShareConfigButton from './common/share-config-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 900;
    let height = 600;
    let container;
    let firstTimeStamp;
    // settings
    // let pastTime = 60;
    let timeBinSize = 2;
    let tempoBinSize = 5;
    // data
    let notes = [];

    const estimateTempo = (onsets) => {
        const bpmValues = [];

        // bin into 5 second time bins
        const binTime = d3
            .bin()
            .domain([0, onsets.at(-1)])
            .thresholds(d3.range(0, onsets.at(-1), timeBinSize));
        const binnedByTime = binTime(onsets);
        // handle each time bin separately
        for (const timeBin of binnedByTime) {
            // get IOIs
            const iois = timeBin.map((d, i) =>
                i === 0 ? 0 : d - timeBin[i - 1],
            );
            // filter IOIs
            const filtered = iois.filter((d) => d > 0.05 && d < 1);
            const bpms = filtered.map((d) => {
                // convert to bpm
                d = secondsPerBeatToBpm(d);
                // fold into assumed bpm range
                while (d > 180) {
                    d /= 2;
                }
                while (d < 60) {
                    d *= 2;
                }
                return d;
            });
            // bin into bins of 5 bpms
            const binBpms = d3
                .bin()
                .domain([60, 180])
                .thresholds(d3.range(60, 185, tempoBinSize));
            const binnedByBpm = binBpms(bpms);
            for (const bpm of binnedByBpm) {
                if (bpm.length > 1)
                    bpmValues.push({
                        time0: timeBin.x0,
                        time1: timeBin.x1,
                        tempo0: bpm.x0,
                        tempo1: bpm.x1,
                        count: bpm.length,
                    });
            }
        }
        return bpmValues;
    };

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes.push(noteInSeconds);
        if (notes.length > 1) {
            draw();
        }
    };

    const draw = () => {
        container.textContent = '';
        const bpmValues = estimateTempo(notes);
        let now = 0;
        if (bpmValues.length > 0) {
            now = bpmValues.at(-1).time1;
        }
        // const minTime = now - pastTime;

        const plot = Plot.plot({
            width,
            height,
            // marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                // type: 'band',
                // domain: d3.range(Math.floor(minTime / 5) * 5, now + 5, 5),
                label: 'time in seconds',
            },
            y: {
                // type: 'band',
                // domain: d3.range(60, 185, 5),
                label: 'tempo in BPM',
                grid: true,
            },
            color: {
                label: 'confidence',
                scheme: 'Blues',
                legend: true,
                marginLeft: 150,
                width: 400,
                domain: [0, 10],
                // domain: d3.range(0, 10, 1),
            },
            marks: [
                Plot.ruleY([60, 90, 120, 150, 180]),
                Plot.rect(bpmValues, {
                    x1: 'time0',
                    x2: 'time1',
                    y1: 'tempo0',
                    y2: 'tempo1',
                    fill: 'count',
                    clip: true,
                    tip: true,
                }),
            ],
        });
        container.appendChild(plot);
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            // pastTime,
            firstTimeStamp,
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        // load
        // pastTime = json.pastTime;
        firstTimeStamp = json.firstTimeStamp;
        notes = json.notes;
        draw();
    };
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Play first at one tempo then change to another one. The chart shows you
        the tempo over time, so can see whether you changed correctly. <i
            >This app assumes tempi between 60 and 180 bpm.</i
        >
    </p>
    <ExerciseDrawer>
        <p>1) Play at a contant tempo.</p>
        <p>2) Suddenly double your tempo.</p>
        <p>
            3) Smoothly increase your tempo until you reach about double your
            initial one.
        </p>
        <p>
            4) Switch back and forth between two tempi, try to always hit the
            same two BPM values.
        </p>
    </ExerciseDrawer>
    <!-- <div class="control">
        <label>
            past seconds
            <input
                type="number"
                bind:value="{pastTime}"
                on:change="{draw}"
                min="5"
                max="60"
                step="5"
            />
        </label>
    </div> -->
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <MetronomeButton
            tempo="{120}"
            accent="{4}"
            beepCount="{8}"
            showBeepCountInput
        />
        <ResetNotesButton
            bind:notes
            saveToStorage="{// otherwise too much data
            () => {}}"
            callback="{() => {
                firstTimeStamp = performance.now();
                draw();
            }}"
        />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <ShareConfigButton {getExportData} {loadData} />
    </div>
    <RatingButton appId="{demoInfo.id}" />
    <MidiInput {noteOn} />
    <PcKeyboardInput
        key=" "
        keyDown="{() => noteOn({ timestamp: performance.now() })}"
    />
    <TouchInput
        element="{container}"
        touchStart="{() => noteOn({ timestamp: performance.now() })}"
    />
</main>
