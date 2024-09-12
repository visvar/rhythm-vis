<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import MidiInput from '../demos/common/midi-input.svelte';
    import {
        localStorageAddRecording,
        localStorageGetSetting,
    } from '../lib/localstorage';
    import { detectChords } from '../lib/chords';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import HistoryButton from './common/history-button.svelte';
    import example from '../example-recordings/strumming-pattern.json';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import RatingButton from './common/rating-button.svelte';
    import ShareConfigButton from './common/share-config-button.svelte';

    export let demoInfo;
    let width = 900;
    let height = 200;
    let stringCount = 6;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    let container;
    // settings
    let pastSeconds = 10;
    let maxNoteDistance = 0.05;
    // global settings
    const minVelo = localStorageGetSetting('guitarMidiMinVelocity') ?? 0;
    const minDur = localStorageGetSetting('guitarMidiMinDuration') ?? 0;
    console.log({ minVelo, minDur });
    // data
    let firstTimeStamp = 0;
    let notes = [];
    let openNoteMap = new Map();

    const noteOn = (e) => {
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const string = e.message.channel - 1;
        const note = {
            // ...e.note,
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
            string,
            fret: e.note.number - tuningPitches[string],
        };
        // fix old note if its end was missed
        if (openNoteMap.has(e.note.number)) {
            const oldNote = openNoteMap.get(e.note.number);
            if (oldNote.end === undefined) {
                oldNote.end = noteInSeconds;
            }
        }
        notes.push(note);
        openNoteMap.set(e.note.number, note);
        draw();
    };

    const noteOff = (e) => {
        if (openNoteMap.has(e.note.number)) {
            const note = openNoteMap.get(e.note.number);
            const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
            note.end = noteInSeconds;
            note.duration = note.end - note.time;
        }
        draw();
    };

    const draw = () => {
        const filteredNoise = notes.filter((d) => {
            // only handle recent notes
            return (
                // filter noise
                d.velocity >= minVelo &&
                (d.duration === undefined || d.duration >= minDur)
            );
        });
        let maxTime = 0.5;
        if (filteredNoise.length > 0) {
            maxTime = notes.at(-1).time + 0.5;
        }
        const minTime = maxTime - pastSeconds;
        const filtered = notes.filter(
            (d) => d.end > minTime || d.end === undefined,
        );
        const chords = detectChords(filtered, maxNoteDistance);
        const chordInfo = chords.map((chord) => {
            const stringExtent = d3.extent(chord, (d) => d.string);
            const timeExtent = d3.extent(chord, (d) => d.time);
            const timeDelta = chord
                .slice(1)
                .map((n, i) => n.string - chord[i].string);
            let direction;
            if (stringExtent[0] === stringExtent[1]) {
                direction = 'single note';
            } else {
                direction = d3.median(timeDelta) > 0 ? 'up' : 'down';
            }
            return {
                minString: stringExtent[0],
                maxString: stringExtent[1],
                minTime: timeExtent[0],
                maxTime: timeExtent[1],
                direction,
                meanVelocity: d3.mean(chord, (d) => d.velocity),
            };
        });
        // plot
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 40,
            x: {
                label: 'time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                label: 'string',
                grid: true,
                domain: d3.range(0, stringCount),
                tickFormat: (d) => tuningNotes[d],
            },
            color: {
                type: 'categorical',
                label: 'MIDI channel',
                scheme: 'observable10',
                reverse: true,
                legend: true,
                marginLeft: 100,
                width: 300,
                domain: d3.range(1, stringCount + 1),
            },
            opacity: {
                domain: [0, 127],
            },
            marks: [
                Plot.tickX(filtered, {
                    clip: true,
                    x: 'time',
                    y: 'string',
                    stroke: 'channel',
                    opacity: 'velocity',
                    strokeWidth: 3,
                }),
            ],
        });
        const plot2 = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 40,
            x: {
                label: 'time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                label: 'string',
                grid: true,
                domain: d3.range(0, stringCount),
                tickFormat: (d) => tuningNotes[d],
                padding: 0.7,
            },
            color: {
                type: 'categorical',
                scheme: 'observable10',
                legend: true,
                marginLeft: 100,
                width: 300,
                domain: ['up', 'down', 'single note'],
            },
            marks: [
                Plot.rect(chordInfo, {
                    clip: true,
                    x1: 'minTime',
                    x2: 'maxTime',
                    y1: 'minString',
                    y2: 'maxString',
                    fill: 'direction',
                    opacity: 'meanVelocity',
                    rx: 5,
                }),
                Plot.dot(chordInfo, {
                    clip: true,
                    x: (d) => (d.minTime + d.maxTime) / 2,
                    y: (d) =>
                        d.direction === 'down' ? d.minString : d.maxString,
                    fill: 'direction',
                    symbol: 'diamond',
                    r: 10,
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
        container.appendChild(plot2);
    };

    onMount(() => {
        firstTimeStamp = performance.now();
        draw();
    });

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            pastSeconds,
            maxNoteDistance,
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        saveToStorage();
        pastSeconds = json.pastSeconds;
        maxNoteDistance = json.maxNoteDistance;
        // data
        notes = json.notes;
        draw();
    };

    const saveToStorage = () => {
        if (
            notes.length > 0 &&
            JSON.stringify(notes) !== JSON.stringify(example.notes)
        ) {
            localStorageAddRecording(demoInfo.id, getExportData());
        }
    };

    onDestroy(saveToStorage);
</script>

<main class="app">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        This demo shows you how you strummed (up or down? which strings?), so
        you can make sure you strumm a pattern as intended. The upper chart
        shows you the when you played a note on which string. The lower chart
        shows you the time between the start of the first and last note of the
        chord (rectangle width) and which strings it spanned (rectangle y and
        height). Blue chords were strummed upward and orange ones downward. The
        strumming direction is further indicated by arrow heads. Due to how
        guitar tabs are drawn from the point of view of the guitarist, downward
        strumming will result in upward arrows in the lower visualization.
        Single notes are drawn in red. The opactiy encodes the notes' mean
        velocity (loudness).
    </p>
    <ExerciseDrawer>
        <p>
            1) Strum up and down alternating: <code>U D U D</code>.
        </p>
        <p>
            2) Strumming a pattern like <code>D U U D</code> or
            <code>D D U D</code>.
        </p>
        <p>
            3) Strum chords like Am, E, G, D and make sure you only strum the
            strings you intend.
        </p>
    </ExerciseDrawer>
    <div class="control">
        <label title="time in seconds for past notes to be shown">
            time
            <input
                type="number"
                bind:value="{pastSeconds}"
                on:change="{draw}"
                min="10"
                max="300"
                step="10"
            />
        </label>
        <label
            title="maximum distance between notes such that they still count as beloning to the same chord"
        >
            max. note distance
            <input
                type="number"
                bind:value="{maxNoteDistance}"
                on:change="{draw}"
                min="0.01"
                max="5"
                step="0.01"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton
            {saveToStorage}
            bind:notes
            callback="{() => {
                openNoteMap = new Map();
                firstTimeStamp = performance.now();
                draw();
            }}"
        />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <HistoryButton demoId="{demoInfo.id}" {loadData} />
        <ShareConfigButton {getExportData} {loadData} appId="{demoInfo.id}" />
    </div>
    <RatingButton appId="{demoInfo.id}" />
    <MidiInput {noteOn} {noteOff} />
</main>
