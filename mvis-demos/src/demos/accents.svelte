<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Utils } from 'musicvis-lib';
    import { toggleOnIcon, toggleOffIcon } from '../lib/icons.js';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import NoteCountInput from './common/note-count-input.svelte';
    import { noteDurations } from '../lib/note-durations.js';
    import MidiInput from './common/midi-input.svelte';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage.js';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import example from '../example-recordings/accents.json';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let container;
    // settings
    let tempo = 120;
    let pastNoteCount = 12;
    let useDotted = true;
    // data
    let firstTimeStamp = 0;
    let notes = [];
    // domain knowledge
    // 𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯
    const possibilities = noteDurations;
    const possibilitiesNonDotted = possibilities.filter((d) => !d.dotted);

    const noteOn = async (e) => {
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = {
            time: noteInSeconds,
            velocity: e.velocity,
        };
        notes.push(note);
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
        const deltas = sliced.map((d, i) => {
            if (i === 0) {
                return {};
            }
            const delta = d.time - sliced[i - 1].time;
            return {
                delta: delta / quarter,
                velocity: sliced[i - 1].velocity,
            };
        });

        const poss = useDotted ? possibilities : possibilitiesNonDotted;
        const bestFit = deltas.slice(1).map((delta) => {
            const bestIndex = d3.minIndex(poss, (d) =>
                Math.abs(delta.delta - d.beats),
            );
            const best = poss[bestIndex];
            return {
                ...best,
                beats: delta,
                velocity: delta.velocity,
                offsetPercent: ((delta.delta / best.beats) * 100).toFixed(),
            };
        });
        // plot
        const plot = Plot.plot({
            width,
            height: 100,
            marginLeft: 80,
            x: {
                label: '',
                domain: d3.range(1, pastNoteCount),
                ticks: [],
            },
            y: {},
            marks: [
                Plot.text(bestFit, {
                    text: 'symbol',
                    x: (d, i) => i,
                    fontSize: (d) => d.velocity * 60 + 10,
                }),
            ],
        });
        container.appendChild(plot);
        // legend
        const plot2 = Plot.plot({
            subtitle: 'size legend',
            width: width,
            height: 100,
            marginLeft: width / 3,
            marginRight: width / 3,
            x: {
                label: 'loudness',
                labelAnchor: 'center',
            },
            marks: [
                Plot.text(d3.range(0.1, 1.1, 0.1), {
                    text: (d) => '𝅘𝅥',
                    x: (d, i) => d,
                    fontSize: (d) => d * 60 + 10,
                }),
            ],
        });
        container.appendChild(plot2);
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            pastNoteCount,
            useDotted,
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

    onMount(draw);

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Set a tempo and start playing. The time between the notes you play will
        be displayed as note symbols, so you can see whether you play, for
        example, correct quarter notes. The note's velocity is encoded as font
        size, so you can see whether you accent the correct notes, for example
        the first note in each triplet, or the the first in each group of 4. You
        can also try different accent patterns such as:
    </p>
    <p>
        <b>1</b>e+<b>a</b> 2e+a 3<b>e</b>+a <b>4</b>e+a
    </p>
    <p>
        <span class="acc">𝅘𝅥</span> 𝅘𝅥 𝅘𝅥 <span class="acc">𝅘𝅥</span> | 𝅘𝅥 𝅘𝅥 𝅘𝅥 𝅘𝅥 | 𝅘𝅥
        <span class="acc">𝅘𝅥</span>
        𝅘𝅥 𝅘𝅥 |
        <span class="acc">𝅘𝅥</span>
        𝅘𝅥 𝅘𝅥 𝅘𝅥
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
</main>

<style>
    .acc {
        font-size: 1.6em;
    }
</style>
