<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { toggleOffIcon, toggleOnIcon } from '../lib/icons';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import ResetNotesButton from './common/reset-notes-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let height = 650;
    let container;
    let midiDevices = [];
    // settings
    let filterUnison = true;
    let useColors = false;
    let useSemitones = false;
    // data
    let notes = [];

    // domain knowledge
    // see https://muted.io/intervals-chart/
    // TODO: go up to 24?
    const intervalNames = [
        { semitones: 0, name: 'Unison', short: 'P1', type: 'perfect' },
        { semitones: 1, name: 'Minor 2nd', short: 'm2', type: 'minor' },
        { semitones: 2, name: 'Major 2nd', short: 'M2', type: 'major' },
        { semitones: 3, name: 'Minor 3rd', short: 'm3', type: 'minor' },
        { semitones: 4, name: 'Major 3rd', short: 'M3', type: 'major' },
        { semitones: 5, name: 'Perfect 4th', short: 'P4', type: 'perfect' },
        { semitones: 6, name: 'Augmented 4th', short: 'A4', type: 'tritone' },
        { semitones: 7, name: 'Perfect 5th', short: 'P5', type: 'perfect' },
        { semitones: 8, name: 'Minor 6th', short: 'm6', type: 'minor' },
        { semitones: 9, name: 'Major 6th', short: 'M6', type: 'major' },
        { semitones: 10, name: 'Minor 7th', short: 'm7', type: 'minor' },
        { semitones: 11, name: 'Major 7th', short: 'M7', type: 'major' },
        { semitones: 12, name: 'Perfect 8ve', short: 'P8', type: 'perfect' },
    ];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('noteon', noteOn);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

    const noteOn = (e) => {
        const note = {
            // ...e.note,
            number: e.note.number,
            velocity: e.rawVelocity,
            time: e.timestamp,
            // channel: e.message.channel,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        // TODO: filter notes which are too close together
        // TODO: filter notes with low velocity
        let intervals = notes.map((d, i) =>
            i === 0 ? 0 : d.number - notes[i - 1].number,
        );
        if (filterUnison) {
            intervals = intervals.filter((d) => d !== 0);
        }
        intervals = intervals.map((d) => {
            if (Math.abs(d) <= 12) {
                return d;
            } else {
                const sub = d > 0 ? 12 : -12;
                while (Math.abs(d) > 12) {
                    d -= sub;
                }
                return d;
            }
        });
        const grouped = d3
            .groups(intervals, (d) => d)
            .map(([int, grp]) => {
                return { interval: int, count: grp.length };
            });

        const plot = Plot.plot({
            width,
            height,
            marginLeft: 120,
            marginRight: 10,
            color: {
                legend: useColors,
                domain: ['minor', 'major', 'perfect', 'tritone'],
                range: ['#7da2e8', '#ed796a', 'gold', '#ccc'],
            },
            x: {
                // axis: false,
            },
            y: {
                // ticks: rules,
                tickFormat: useSemitones
                    ? (d) => d
                    : (d) =>
                          d >= 0
                              ? intervalNames[d].name
                              : intervalNames[-d].name,
                domain: d3.range(-12, 13, 1),
                label: `🡸 going down ${' '.repeat(75)} going up 🡺     `,
                reverse: true,
                // type: 'ordinal',
            },
            marks: [
                Plot.ruleY([-12, 0, 12], { stroke: '#888', strokeWidth: 1.5 }),
                Plot.barX(grouped, {
                    x: 'count',
                    y: 'interval',
                    // fill: '#ddd',
                    fill: useColors
                        ? (d) => intervalNames[Math.abs(d.interval)].type
                        : '#ddd',
                    dx: 0.5,
                    rx: 4,
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
    };

    const exportData = () => {
        const data = {
            filterUnison,
            useColors,
            useSemitones,
            notes,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    const importData = async (e) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            filterUnison = json.filterUnison;
            useColors = json.useColors;
            useSemitones = json.useSemitones;
            notes = json.notes;
            draw();
        }
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        draw();
    });

    onDestroy(() => {
        // remove MIDI listeners to avoid duplicate calls and improve performance
        for (const input of WebMidi.inputs) {
            input.removeListener();
        }
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument (currently {midiDevices.length} connected) and
        start playing. The bar chart below shows how often you played each interval:
        when you go up in pitch, the bar of the played interval in the top half will
        increase. If you go down, it will show up in the bottom half. Colors denote
        the type of interval, so you can quickly see if you play, for example, more
        major or minor intervals.
    </p>
    <div class="control">
        <button
            title="Toggle filtering unison intervals"
            on:click="{() => {
                filterUnison = !filterUnison;
                draw();
            }}"
        >
            unison {!filterUnison ? toggleOnIcon : toggleOffIcon}
        </button>
        <button
            title="Use colors for interval types"
            on:click="{() => {
                useColors = !useColors;
                draw();
            }}"
        >
            colors {useColors ? toggleOnIcon : toggleOffIcon}
        </button>
        <button
            title="Show number of semitones instead of musical names for intervals on the y axis"
            on:click="{() => {
                useSemitones = !useSemitones;
                draw();
            }}"
        >
            semitones {useSemitones ? toggleOnIcon : toggleOffIcon}
        </button>
        <!-- <label
            title="You can filter out bars that are shorter than a given note duration."
        >
            filtering
            <select bind:value="{filterNote}" on:change="{draw}">
                <option value="{0}">off</option>
                {#each [16, 32, 64, 128] as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label> -->
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
    </div>
</main>

<style>
    /* adjust color legend position */
    div :global(figure > div) {
        margin-left: 100px;
    }
</style>
