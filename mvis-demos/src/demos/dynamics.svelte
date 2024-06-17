<script>
    import { onDestroy, onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import { toggleOffIcon, toggleOnIcon } from '../lib/icons';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import { VELOCITIES_LOGIC } from '../lib/music';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 600;
    let container;
    const velocities = VELOCITIES_LOGIC;
    // settings
    let isBinning = true;
    let barLimit = 50;
    // data
    let notes = [];

    const noteOn = (e) => {
        notes.push(e.rawVelocity);
        draw();
    };

    const draw = () => {
        // round bars' height to make view clearer
        let binnedVelocities = notes;
        if (isBinning) {
            binnedVelocities = notes.map((d) => {
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

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            isBinning,
            barLimit,
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            isBinning = json.isBinning;
            barLimit = json.barLimit;
            // data
            notes = json.notes;
            draw();
        }
    };

    const saveToStorage = () => {
        if (notes.length > 0) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument and start playing. The loudness of each note
        will be shown as a bar. Bar heights are either exact or rounded to the
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
            binning {isBinning ? toggleOnIcon : toggleOffIcon}
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
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
    </div>
    <MidiInput {noteOn} />
</main>

<style>
    div :global(text) {
        font-size: 16px;
    }
</style>
