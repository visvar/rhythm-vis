<script>
    import { onDestroy, onMount } from 'svelte';
    import { Utils } from 'musicvis-lib';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { secondsPerBeatToBpm } from '../lib/lib';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import { BIN_NOTES } from '../lib/music';
    import MetronomeButton from './common/metronome-button.svelte';
    import example from '../example-recordings/tempo-drift.json';
    import { localStorageAddRecording } from '../lib/localstorage';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import LoadFromStorageButton from './common/history-button.svelte';
    import TouchInput from './common/touch-input.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import RatingButton from './common/rating-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 900;
    let height = 750;
    let container;
    // settings
    let tempo = 120;
    let binNote = 'off';
    let filterNote = 0;
    let barLimit = 50;
    // data
    let firstTimeStamp = 0;
    let notes = [];
    let estimatedTempo = 0;

    const noteOn = (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes.push(noteInSeconds);
        draw();
    };

    const draw = () => {
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        const sixteenth = quarter / 4;
        const eighth = quarter / 2;
        const half = quarter * 2;
        const whole = quarter * 4;
        const rules = [
            0,
            sixteenth,
            eighth,
            eighth * 1.5,
            quarter,
            quarter * 1.5,
            half,
            half * 1.5,
        ];
        const rulesText = ['0', '𝅘𝅥𝅯', '𝅘𝅥𝅮', '𝅘𝅥𝅮.', '𝅘𝅥', '𝅘𝅥.', '𝅗𝅥', '𝅗𝅥.'];
        // get inter-onset intervals
        let iois = notes.map((d, i) => (i === 0 ? 0 : d - notes[i - 1]));
        if (filterNote !== 0) {
            const minSize = whole / filterNote;
            iois = iois.filter((d) => d >= minSize);
        }
        // round bars' height to make view clearer
        let binnedIois = iois;
        if (binNote !== 'off') {
            const binSize = whole / binNote;
            binnedIois = iois.map((d) => Math.round(d / binSize) * binSize);
        }
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
                tickFormat: (d) => {
                    const index = rules.indexOf(d);
                    return rulesText[index];
                },
                domain: [0, half * 1.1],
                tickSize: 0,
            },
            marks: [
                Plot.barY(binnedIois.slice(-barLimit), {
                    x: (d, i) => i,
                    y: (d) => d,
                    fill: '#ddd',
                    inset: 0,
                    dx: 0.5,
                }),
                Plot.ruleY(rules, {
                    stroke: '#aaa',
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);

        // tempo estimation
        const lastNotes = iois
            .filter((d) => d > 0.8 * sixteenth && d < 1.25 * quarter)
            .slice(-24)
            .map((d) =>
                d < 0.6 * quarter ? d * 2 : d > 1.5 * quarter ? d / 2 : d,
            );
        estimatedTempo = secondsPerBeatToBpm(d3.mean(lastNotes));
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            binNote,
            filterNote,
            barLimit,
            notes,
        };
    };

    const loadData = (json) => {
        if (notes.length > 0) {
            saveToStorage();
        }
        tempo = json.tempo;
        binNote = json.binNote ?? 'off';
        filterNote = json.filterNote ?? 'off';
        barLimit = json.barLimit;
        notes = json.notes;
        draw();
    };

    const saveToStorage = () => {
        if (notes.length > 0) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onMount(draw);

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument, choose your tempo, and start playing. The
        time between two note onsets will be shown as a bar, so you can see how
        well you still hit, for example, quarter notes after playing for some
        time. Bar heights are either exact or rounded to a certain duration
        precision. You can filter very short inter-note times, which happen when
        playing two notes at roughly the same time, for example in a chord.
        <i> Try playing without looking! </i>
    </p>
    <ExerciseDrawer>
        <p>
            1) Try to play at a given tempo without count-in. You can use the
            randomize tempo button (⚂) to get challenged for a random tempo.
        </p>
        <p>
            2) After the count-in, keep the tempo as constant as possible for a
            few minutes.
        </p>
    </ExerciseDrawer>
    <div class="control">
        <label title="The tempo in beats per minute (bpm)">
            tempo
            <input
                type="number"
                bind:value="{tempo}"
                on:change="{draw}"
                step="1"
                min="10"
                max="400"
                style="width: 55px"
            />
        </label>
        <button
            title="randomize tempo"
            on:click="{() => {
                let newTempo = tempo;
                while (newTempo === tempo) {
                    newTempo = Math.round(Math.random() * 12 + 6) * 10;
                }
                tempo = newTempo;
            }}"
        >
            ⚂
        </button>
        <label
            title="You can change between seeing exact bar heights and binned (rounded) heights."
        >
            rounding
            <select bind:value="{binNote}" on:change="{draw}">
                <option value="off">off</option>
                {#each BIN_NOTES as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
        <label
            title="You can filter out notes that are shorter than a given note duration."
        >
            filtering
            <select bind:value="{filterNote}" on:change="{draw}">
                <option value="{0}">off</option>
                {#each BIN_NOTES as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
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
    {#if estimatedTempo}
        <div>
            estimated: {estimatedTempo.toFixed()} bpm (assuming quarter notes)
        </div>
    {/if}
    <div class="control">
        <MetronomeButton
            {tempo}
            accent="{4}"
            beepCount="{8}"
            showBeepCountInput
        />
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
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

<style>
    div :global(text) {
        font-size: 32px;
    }
</style>
