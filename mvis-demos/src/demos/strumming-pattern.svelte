<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';
    import MidiInput from '../demos/common/midi-input.svelte';
    import { localStorageGetSetting } from '../lib/localstorage';
    import { detectChords } from '../lib/chords';

    export let demoInfo;
    let width = 1000;
    let height = 200;
    let stringCount = 6;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
    let container;
    // settings
    let pastSeconds = 10;
    let maxNoteDistance = 0.1;
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
        const maxTime = (performance.now() - firstTimeStamp) / 1000 + 0.5;
        const minTime = maxTime - pastSeconds;
        const filtered = notes.filter((d) => {
            // only handle recent notes
            return (
                (d.end > minTime || d.end === undefined) &&
                // filter noise
                d.velocity >= minVelo &&
                (d.duration === undefined || d.duration >= minDur)
            );
        });
        const chords = detectChords(filtered, maxNoteDistance);
        const chordInfo = chords.map((chord) => {
            const stringExtent = d3.extent(chord, (d) => d.string);
            const timeExtent = d3.extent(chord, (d) => d.time);
            const timeDelta = chord
                .slice(1)
                .map((n, i) => n.string - chord[i].string);
            return {
                minString: stringExtent[0],
                maxString: stringExtent[1],
                minTime: timeExtent[0],
                maxTime: timeExtent[1],
                direction: d3.median(timeDelta) > 0 ? 'up' : 'down',
            };
        });
        // plot
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 40,
            x: {
                label: 'Time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                label: 'String',
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
                label: 'Time in seconds',
                domain: [minTime, maxTime],
            },
            y: {
                label: 'Strumming',
                grid: true,
                domain: d3.range(0, stringCount),
                tickFormat: (d) => tuningNotes[d],
            },
            color: {
                type: 'categorical',
                scheme: 'observable10',
                legend: true,
                marginLeft: 100,
                width: 300,
                domain: ['up', 'down'],
            },
            marks: [
                Plot.rect(chordInfo, {
                    clip: true,
                    x1: 'minTime',
                    x2: 'maxTime',
                    y1: 'minString',
                    y2: 'maxString',
                    fill: 'direction',
                    rx: 5,
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
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        This demo shows you how you strummed (up or down? which strings?), so
        you can make sure you strumm a pattern as intended. For example, try
        strumming D U U D. The upper chart shows you the when you played a note
        on which string. The lower chart shows you the time between the start of
        the first and last note of the chord (rectangle width) and which strings
        it spanned (rectangle y and height). Blue chords were strummed upward
        and orange ones downward.
    </p>
    <div class="control">
        <label title="time in seconds for past notes to be shown">
            time
            <input
                type="number"
                bind:value="{pastSeconds}"
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
                min="0.05"
                max="5"
                step="0.05"
            />
        </label>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    notes = [];
                    openNoteMap = new Map();
                    firstTimeStamp = performance.now();
                }
            }}"
        >
            reset
        </button>
    </div>
    <MidiInput {noteOn} {noteOff} />
</main>