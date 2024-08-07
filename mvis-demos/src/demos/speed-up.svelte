<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Utils } from 'musicvis-lib';
    import Metronome from '../lib/Metronome.js';
    import { delay } from '../lib/lib';
    import TempoInput from './common/tempo-input.svelte';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage.js';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import example from '../example-recordings/speed-up.json';
    import { reviver } from '../lib/json.js';
    import TouchInput from './common/touch-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 50;
    let container;
    let metro = new Metronome();
    // settings
    let initialTempo = 60;
    let targetTempo = 120;
    let tempoIncrease = 10;
    let quantize = 'off';

    // data
    let currentStep = '';
    let currentTempo = targetTempo;
    let firstTimeStamp = performance.now();
    let exerciseNotes = [];
    let exerciseBeatCount;
    // Map bpm->notes
    let practiceRecordings = new Map();
    let ready = true;
    let tempoStepWatcher;

    const noteOn = async (e) => {
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = noteInSeconds;
        if (currentStep === 'input exercise') {
            // currently inputting the exercise
            exerciseNotes = [...exerciseNotes, note];
        } else if (currentStep === 'practice') {
            // currently practicing
            if (!practiceRecordings.has(currentTempo)) {
                practiceRecordings.set(currentTempo, []);
            }
            const notes = practiceRecordings.get(currentTempo);
            // only save note if recorder is ready (short delay after metronome stop)
            if (ready) {
                notes.push(note);
            }
        }
        draw();
    };

    /**
     * Regularly check if the tempo should be increased now
     *
     */
    const checkIfTempoIncrease = async () => {
        // check if current tempo is complete
        const notes = practiceRecordings.get(currentTempo);
        if (!notes || !notes.length) {
            return;
        }
        const minTime = d3.min(notes);
        const now = (performance.now() - firstTimeStamp) / 1000;
        const currentDuration = now - minTime;
        let quarter = Utils.bpmToSecondsPerBeat(currentTempo);
        const currentBeats = currentDuration / quarter;
        if (currentBeats >= exerciseBeatCount) {
            console.log(`increasing bpm`);
            // go to next step
            metro.stop();
            if (currentTempo < targetTempo) {
                currentTempo += tempoIncrease;
                ready = false;
                await delay(1);
                metro.start(240, 1, 3);
                await delay(3);
                metro.start(currentTempo, 4);
                // make sure we have a clean start, ie reset current recording
                if (practiceRecordings.has(currentTempo)) {
                    practiceRecordings.set(currentTempo, []);
                }
                ready = true;
            } else {
                stopPractice();
            }
        }
    };

    const inputExercise = () => {
        currentStep = 'input exercise';
        // reset practice
        exerciseNotes = [];
        practiceRecordings = new Map();
        metro.start(initialTempo, 4);
        draw();
    };

    const saveExercise = () => {
        currentStep = '';
        metro.stop();
        if (exerciseNotes.length > 0) {
            // get exercise duration in beats
            const exerciseDuration =
                d3.max(exerciseNotes) - d3.min(exerciseNotes);
            let quarter = Utils.bpmToSecondsPerBeat(initialTempo);
            exerciseBeatCount = Math.ceil(exerciseDuration / quarter);
        }
    };

    const startPractice = async () => {
        if (exerciseNotes.length === 0) {
            alert('You need to input an exercise first');
            return;
        }
        currentStep = 'practice';
        currentTempo = initialTempo;
        practiceRecordings = new Map();
        metro.start(currentTempo, 4);
        tempoStepWatcher = setInterval(checkIfTempoIncrease, 100);
    };

    const stopPractice = () => {
        console.log('stop practice');
        currentStep = '';
        currentTempo = targetTempo;
        clearInterval(tempoStepWatcher);
        metro.stop();
    };

    /**
     * Draw visualization
     */
    const draw = () => {
        container.textContent = '';
        if (exerciseNotes.length === 0) {
            return;
        }
        // quantize exercise notes and convert time to beats
        let quarter = Utils.bpmToSecondsPerBeat(initialTempo);
        const quantized = quantizeAndScaleNotes(
            exerciseNotes,
            quantize,
            quarter,
        );
        let maxBeat = Math.ceil((d3.max(quantized) / 4) * 4) + 1;
        console.log(quantized, maxBeat);
        // plot
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 40,
            x: {
                label: 'time in beats',
                domain: [0, maxBeat],
            },
            y: {},
            marks: [
                // beat marks
                Plot.ruleX(d3.range(0, maxBeat, 1), {
                    stroke: '#ccc',
                }),
                // bar marks
                Plot.ruleX(d3.range(0, maxBeat + 1, 4)),
                // notes
                Plot.dot(quantized, {
                    symbol: 'times',
                    stroke: '#666',
                    x: (d) => d,
                    r: 4,
                }),
            ],
        });
        container.appendChild(plot);

        // plot practice notes, one plot per tempo
        for (const [tempo, notes] of practiceRecordings) {
            const firstNoteTime = notes[0];
            quarter = Utils.bpmToSecondsPerBeat(tempo);
            const inBeats = notes.map((d) => (d - firstNoteTime) / quarter);
            const plot = Plot.plot({
                width,
                height: 70,
                marginLeft: 40,
                x: {
                    domain: [0, maxBeat],
                },
                y: {
                    label: `${tempo} BPM`,
                    ticks: [],
                },
                marks: [
                    Plot.text([0], {
                        text: `${tempo} BPM`,
                    }),
                    // beat marks
                    Plot.ruleX(d3.range(0, maxBeat, 1), {
                        stroke: '#ccc',
                    }),
                    // bar marks
                    Plot.ruleX(d3.range(0, maxBeat + 1, 4)),
                    // notes
                    Plot.dot(inBeats, {
                        symbol: 'times',
                        stroke: '#666',
                        x: (d) => d,
                        r: 4,
                    }),
                ],
            });
            container.appendChild(plot);
        }
    };

    onMount(draw);

    function quantizeAndScaleNotes(notes, quantize, quarter) {
        const firstNoteTime = notes[0];
        const quantized = notes.map((d) => {
            // time relative to first note
            let time = d - firstNoteTime;
            // quantize to 16th note or so
            if (quantize !== 'off') {
                let q;
                if (quantize === '8th') {
                    q = quarter / 2;
                }
                if (quantize === '16th') {
                    q = quarter / 4;
                }
                if (quantize === '32nd') {
                    q = quarter / 8;
                }
                if (quantize === 'triplet') {
                    q = quarter / 3;
                }
                if (quantize === 'quintuplet') {
                    q = quarter / 5;
                }
                time = Math.round(time / q) * q;
            }
            return time / quarter;
        });
        return quantized;
    }

    const predefinedExercise = (e) => {
        const ex = e.target.value;
        const beatCount = 8;
        const exercises = new Map([
            ['quarter', d3.range(0, beatCount, 1)],
            ['eighth', d3.range(0, beatCount, 0.5)],
            ['triplets', d3.range(0, beatCount, 1 / 3)],
            ['quintuplets', d3.range(0, beatCount, 1 / 5)],
            [
                'swing',
                d3
                    .range(0, beatCount, 0.5)
                    .map((d, i) => (i % 2 === 0 ? i : i + 0.2)),
            ],
        ]);
        const quarter = Utils.bpmToSecondsPerBeat(initialTempo);
        quantize = 'off';
        const beats = exercises.get(ex);
        exerciseNotes = beats.map((d) => d * quarter);
        exerciseBeatCount = Math.ceil(d3.max(beats) + 1);
        draw();
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            // settings
            initialTempo,
            targetTempo,
            tempoIncrease,
            quantize,
            // data
            currentStep,
            currentTempo,
            firstTimeStamp,
            exerciseNotes,
            exerciseBeatCount,
            practiceRecordings,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        if (
            exerciseNotes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            if (exerciseNotes.length > 0) {
                saveToStorage();
            }
            // settings
            initialTempo = json.initialTempo;
            targetTempo = json.targetTempo;
            tempoIncrease = json.tempoIncrease;
            quantize = json.quantize;
            // data
            currentStep = json.currentStep;
            currentTempo = json.currentTempo;
            firstTimeStamp = json.firstTimeStamp;
            exerciseNotes = json.exerciseNotes;
            exerciseBeatCount = json.exerciseBeatCount;
            practiceRecordings = json.practiceRecordings;
            if (practiceRecordings.dataType) {
                practiceRecordings = new Map(practiceRecordings.value);
            }
            draw();
        }
    };

    const saveToStorage = () => {
        if (exerciseNotes.length > 0) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onDestroy(() => {
        clearInterval(tempoStepWatcher);
        metro.stop();
        saveToStorage();
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Adjust the initial and target tempo, record an exercise at the inital
        tempo, and then practice it with increasing speed until you reach your
        target tempo.
    </p>
    <div class="control">
        <TempoInput
            label="initial tempo"
            title="Set a tempo at which you are able to input the exercise precisely (in BPM)"
            bind:value="{initialTempo}"
            callback="{draw}"
        />
        <TempoInput
            label="target tempo"
            title="Set the tempo you want to be able to play the exercise at (in BPM)"
            bind:value="{targetTempo}"
            callback="{draw}"
        />
        <label title="Set the tempo increase between practice runs (in BPM)">
            tempo increase
            <input
                type="number"
                bind:value="{tempoIncrease}"
                min="1"
                max="20"
                step="1"
            />
        </label>
        <label>
            quantize exercise
            <select bind:value="{quantize}" on:change="{draw}">
                {#each ['off', '32nd', '16th', '8th', 'triplet', 'quintuplet'] as d}
                    <option value="{d}">{d}</option>
                {/each}
            </select>
        </label>
    </div>
    <div class="control">
        <label>
            pre-defined exercise
            <select on:change="{predefinedExercise}">
                <option selected disabled></option>
                {#each ['quarter', 'eighth', 'triplets', 'quintuplets', 'swing'] as d}
                    <option>{d}</option>
                {/each}
            </select>
        </label>
        <button
            title="Start recording the exercise."
            on:click="{inputExercise}"
            disabled="{currentStep === 'input exercise' ||
                currentStep === 'practice'}"
        >
            input exercise
        </button>
        <button
            title="Stop recording the exercise."
            on:click="{saveExercise}"
            disabled="{currentStep !== 'input exercise'}"
        >
            save exercise
        </button>
        <button
            title="Start recording the practice with speed-up."
            on:click="{startPractice}"
            disabled="{exerciseNotes.length === 0}"
        >
            start practice
        </button>
        <button
            title="Stop recording the practice with speed-up."
            on:click="{stopPractice}"
            disabled="{currentStep !== 'practice'}"
        >
            stop practice
        </button>
    </div>
    <div>
        current step: <b>{currentStep}</b> current tempo: <b>{currentTempo}</b> BPM
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton
            {saveToStorage}
            title="Clear practice but not exercise"
            disabled="{currentStep !== ''}"
            callback="{() => {
                if (confirm('Reset practice?')) {
                    saveToStorage();
                    practiceRecordings = new Map();
                    firstTimeStamp = performance.now();
                    draw();
                }
            }}"
        />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
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
