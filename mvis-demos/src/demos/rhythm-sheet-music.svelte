<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Utils } from 'musicvis-lib';
    import { toggleOnIcon, toggleOffIcon } from '../lib/icons.js';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import NoteCountInput from './common/note-count-input.svelte';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import { noteDurations } from '../lib/note-durations.js';
    import MidiInput from './common/midi-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage.js';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import example from '../example-recordings/rhythm-sheet-music.json';
    import TouchInput from './common/touch-input.svelte';
    import { FILTER_NOTES } from '../lib/music.js';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let container;
    // settings
    let tempo = 120;
    let pastNoteCount = 10;
    let useDotted = true;
    let filterNote = 16;
    let targetDuration = 'auto';
    // data
    $: minIOI = (Utils.bpmToSecondsPerBeat(tempo) * 4) / filterNote;
    let firstTimeStamp = 0;
    let notes = [];
    // colors
    const orange = d3.schemeObservable10[1];
    const blue = d3.schemeObservable10[0];
    // domain knowledge
    // 𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯
    const possibilities = noteDurations;
    const possibilitiesNonDotted = possibilities.filter((d) => !d.dotted);

    const noteOn = async (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        // check if note is too close to prior and skip if so
        if (notes.length > 0 && noteInSeconds - notes.at(-1) < minIOI) {
            return;
        }
        notes.push(noteInSeconds);
        draw();
    };

    /**
     * Draw visualization
     */
    const draw = () => {
        container.textContent = '';
        if (notes.length === 0) {
            return;
        }
        let quarter = Utils.bpmToSecondsPerBeat(tempo);
        const sliced = notes.slice(-(pastNoteCount + 1));
        const deltas = sliced.map((d, i) => (i === 0 ? 0 : d - sliced[i - 1]));
        const inBeats = deltas.map((d) => d / quarter);
        // for each IOI, determine the closest duration
        let bestFit;
        if (targetDuration === 'auto') {
            // use dotted notes or not?
            const poss = useDotted ? possibilities : possibilitiesNonDotted;
            bestFit = inBeats.map((delta) => {
                const bestIndex = d3.minIndex(poss, (d) =>
                    Math.abs(delta - d.beats),
                );
                const best = poss[bestIndex];
                return {
                    ...best,
                    beats: delta,
                    offsetPercent: ((delta / best.beats) * 100).toFixed(),
                };
            });
        } else {
            // ...or, if target is set, use it for all notes
            const targetObj = noteDurations.filter(
                (d) => d.name === targetDuration,
            )[0];
            console.log(targetObj);
            bestFit = inBeats.map((delta) => {
                return {
                    ...targetObj,
                    beats: delta,
                    offsetPercent: ((delta / targetObj.beats) * 100).toFixed(),
                };
            });
        }
        console.log(bestFit);

        // plot
        const plot = Plot.plot({
            width,
            height: 100,
            marginTop: 30,
            marginLeft: 100,
            x: {
                label: '',
                domain: d3.range(1, pastNoteCount),
                ticks: [],
            },
            y: {
                domain: [1, 0],
                ticks: d3.range(3),
                tickFormat: (d) => ['note', 'percent too long'][d],
            },
            marks: [
                Plot.text(bestFit, {
                    text: 'symbol',
                    x: (d, i) => i,
                    y: 0,
                    fontSize: 40,
                }),
                // percent deviation
                Plot.text(bestFit, {
                    text: (d) => d.offsetPercent - 100,
                    x: (d, i) => i,
                    y: 1,
                    fontSize: 20,
                }),
            ],
        });
        container.appendChild(plot);
        // plot
        const plot2 = Plot.plot({
            width,
            height: 250,
            marginLeft: 100,
            x: {
                label: 'note',
                domain: d3.range(1, pastNoteCount),
                tickSize: 0,
                ticks: [],
            },
            y: {
                label: 'percent too long',
                domain: [-30, 30],
                ticks: d3.range(-30, 31, 10),
                grid: true,
            },
            marks: [
                Plot.barY(bestFit, {
                    x: (d, i) => i,
                    y: (d) => d.offsetPercent - 100,
                    fill: (d) => (d.offsetPercent < 100 ? orange : blue),
                }),
                Plot.ruleY([0]),
            ],
        });
        container.appendChild(plot2);
    };

    onMount(draw);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            // settings
            tempo,
            pastNoteCount,
            useDotted,
            // data
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
            tempo = json.tempo;
            pastNoteCount = json.pastNoteCount;
            useDotted = json.useDotted;
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
        Set a tempo and start playing. The time between the notes you play will
        be displayed as note symbols, so you can see whether you play, for
        example, correct quarter notes. Numbers show you how many percent of the
        detected note duration you played, for example a -5 means your note was
        5% too short. Bars below show you these percent as well, <span
            style="color:{blue}">blue</span
        >
        for notes that were too long (playing too slow) and
        <span style="color:{orange}">orange</span> for short (fast) ones.
    </p>
    <p>
        Exercises: 1) Switch back and fort between quarters and eighths. 2)
        Switch between eighths and eighth triplets.
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <NoteCountInput bind:value="{pastNoteCount}" callback="{draw}" />
        <button
            title="Use dotted notes? If not, the closest non-dotted note will be taken."
            on:click="{() => {
                useDotted = !useDotted;
                draw();
            }}"
        >
            dotted notes {useDotted ? toggleOnIcon : toggleOffIcon}
        </button>
        <label
            title="You can filter out notes that are shorter than a given note duration."
        >
            filtering
            <select bind:value="{filterNote}" on:change="{draw}">
                {#each FILTER_NOTES as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
        <label
            title="You can choose a single duration you want to practice and turn of automaticly guessing the closest one."
        >
            target
            <select bind:value="{targetDuration}" on:change="{draw}">
                <option value="auto">auto</option>
                {#each noteDurations as d}
                    <option value="{d.name}">{d.symbol} {d.name}</option>
                {/each}
            </select>
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <MetronomeButton {tempo} accent="{4}" />
        <ResetNotesButton bind:notes {saveToStorage} callback="{draw}" />
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
