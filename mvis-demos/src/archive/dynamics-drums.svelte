<script>
    import { onDestroy, onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import { toggleOffIcon, toggleOnIcon } from '../lib/icons';
    import ResetNotesButton from '../common/reset-notes-button.svelte';
    import MidiInput from '../common/midi-input.svelte';
    import ExportButton2 from '../common/export-button2.svelte';
    import ImportExportButton from '../common/import-export-button.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import { VELOCITIES_LOGIC, VELOCITIES_MEANING } from '../lib/music';
    import HistoryButton from '../common/history-button.svelte';
    import example from '../example-recordings/dynamics.json';
    import * as d3 from 'd3';
    import ExerciseDrawer from '../common/exercise-drawer.svelte';
    import { drumPitchReplacementMapMD90 } from '../lib/drums';

    /**
     * contains the app meta information defined in App.js
     */
    export let appInfo;

    let width = 1000;
    let height = 600;
    let container;
    const velocities = VELOCITIES_LOGIC;
    // settings
    let isBinning = false;
    let barLimit = 50;
    // data
    let notes = [];

    const noteOn = (e) => {
        const note = {
            number: e.note.number,
            drum:
                drumPitchReplacementMapMD90.get(e.note.number)?.label ??
                e.note.number,
            velocity: e.rawVelocity,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        // round bars' height to make view clearer
        let binnedVelocities = notes;
        if (isBinning) {
            const veloBinValues = [...velocities.keys()];
            binnedVelocities = notes.map((d) => {
                const minIndex = d3.minIndex(veloBinValues, (v) =>
                    Math.abs(d - v),
                );
                return veloBinValues[minIndex];
            });
        }
        const rules = [...velocities.keys()];
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 45,
            marginRight: 120,
            x: {
                axis: false,
            },
            y: {
                domain: [0, 128],
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
                Plot.axisY({
                    anchor: 'left',
                    ticks: rules,
                    tickFormat: (d) => velocities.get(d),
                    tickSize: 0,
                }),
                Plot.axisY({
                    anchor: 'right',
                    ticks: rules,
                    tickFormat: (d) =>
                        VELOCITIES_MEANING.get(velocities.get(d)),
                    tickSize: 0,
                }),
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
            if (notes.length > 0) {
                saveToStorage();
            }
            isBinning = json.isBinning;
            barLimit = json.barLimit;
            // data
            notes = json.notes;
            draw();
        }
    };

    const saveToStorage = () => {
        if (notes.length > 0) {
            localStorageAddRecording(appInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="app">
    <h2>{appInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument and start playing. The loudness of each note
        will be shown as a bar. Bar heights are either exact or rounded to the
        closest
        <a
            href="https://en.wikipedia.org/wiki/Dynamics_(music)"
            target="_blank"
            referrerpolicy="no-referrer"
        >
            dynamics marking</a
        >.
    </p>
    <ExerciseDrawer>
        <p>1) Play all notes between a mezzo-piano (mp) and a forte (f).</p>
        <p>
            2) Play a crescendo, starting at below pp and rising until above ff
            smoothly.
        </p>
        <p>3) Play a descrescendo from above ff to below pp.</p>
        <p>
            4) Play accents, for example on each 4th note. They should be loud
            enough to be easily distinguishable from the non-accented notes.
        </p>
    </ExerciseDrawer>
    <div class="control">
        <button
            title="You can change between seeing exact bar heights and binned (rounded) heights."
            on:click="{() => {
                isBinning = !isBinning;
                draw();
            }}"
        >
            rounding {isBinning ? toggleOnIcon : toggleOffIcon}
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
        <ExportButton2 {getExportData} appId="{appInfo.id}" />
        <ImportExportButton {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <HistoryButton appId="{appInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} />
</main>

<style>
    div :global(text) {
        font-size: 12px;
    }
</style>
