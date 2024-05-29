<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Scale } from '@tonaljs/tonal';
    import { Midi, Utils } from 'musicvis-lib';
    import { toggleOffIcon, toggleOnIcon } from '../lib/icons';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
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
    let root = 'A';
    let scale = 'minor pentatonic';
    let useColors = true;
    let showOutsideScale = true;
    let tempo = 120;
    // data
    let notes = [];
    // domain knowledge
    const noteNames = Midi.NOTE_NAMES_FLAT;
    const scales = Scale.names();

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
        let seconds = 0;
        if (notes.length > 0) {
            seconds = e.timestamp / 1000 - notes[0].time;
        }
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: seconds,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        if (notes.length === 0) {
            return;
        }
        // MIDI nr (0 to 11) of the scale root
        const rootNr = noteNames.indexOf(root);
        const scaleInfo = Scale.get(`${root} ${scale}`);
        const scaleNotes = scaleInfo.notes.map((note, i) => {
            // note chroma from 0 to 11 (C to B)
            const chroma = noteNames.indexOf(note);
            let offset = chroma - rootNr;
            offset = offset >= 0 ? offset : offset + 12;
            return {
                name: note,
                chroma,
                interval: scaleInfo.intervals[i],
                degree: i,
                offset,
            };
        });
        const scaleOffsets = new Set(scaleNotes.map((d) => d.offset));

        // group by bar
        const barDuration = Utils.bpmToSecondsPerBeat(tempo) * 4;
        const byBar = d3.groups(notes, (d) => Math.floor(d.time / barDuration));

        let data = [];
        // create one histogram per bar
        for (const [barId, notes] of byBar) {
            // note chroma from 0 to 11 (C to B)
            const rootOffsets = notes.map((d) => {
                const chroma = d.number % 12;
                const offset = chroma - rootNr;
                return offset >= 0 ? offset : offset + 12;
            });
            const counted = d3
                .groups(rootOffsets, (d) => d)
                .map(([key, grp]) => {
                    return {
                        value: key,
                        count: grp.length,
                        barId,
                    };
                });
            data = data.concat(counted);
        }
        console.log(data);

        // TODO: allow setting
        const maxBar = Math.floor(notes.at(-1).time / barDuration);
        const minBar = maxBar - 9;
        console.log({ minBar });
        data = data.filter((d) => d.barId >= minBar);

        const plot = Plot.plot({
            width,
            height,
            marginLeft: 70,
            marginRight: 10,
            color: {
                legend: useColors,
                domain: ['root', 'scale', 'outside scale'],
                range: ['#666', '#aaa', '#eee'],
            },
            y: {
                tickFormat: (d) => noteNames[(d + rootNr) % 12],
                domain: showOutsideScale
                    ? d3.range(0, 12, 1)
                    : [...scaleOffsets],
                reverse: true,
                label: 'notes, increasing semitones from root 🡺',
            },
            marks: [
                Plot.barX(data, {
                    x: 'count',
                    y: 'value',
                    fx: 'barId',
                    fill: (d) => {
                        // colors off?
                        if (!useColors) {
                            return '#ddd';
                        }
                        // root?
                        if (d.value === 0) {
                            return '#666';
                        }
                        //  in scale?
                        if (scaleOffsets.has(d.value)) {
                            return '#aaa';
                        }
                        // out of scale
                        return '#eee';
                    },
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
            root,
            scale,
            useColors,
            showOutsideScale,
            notes,
            tempo,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    const importData = async (e) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            root = json.root;
            scale = json.scale;
            useColors = json.useColors;
            showOutsideScale = json.showOutsideScale;
            notes = json.notes;
            tempo = json.tempo;
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
        start playing. The bar chart below shows how often you played each scale
        degree.
    </p>
    <div class="control">
        <label>
            scale
            <select bind:value="{root}" on:change="{draw}">
                {#each noteNames as n}
                    <option value="{n}">{n}</option>
                {/each}
            </select>
            <select bind:value="{scale}" on:change="{draw}">
                {#each scales as s}
                    <option value="{s}">{s}</option>
                {/each}
            </select>
        </label>
    </div>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <button
            title="Use colors for root, in-scale, outside-scale"
            on:click="{() => {
                useColors = !useColors;
                draw();
            }}"
        >
            colors {useColors ? toggleOnIcon : toggleOffIcon}
        </button>
        <button
            title="Show notes outside the scale"
            on:click="{() => {
                showOutsideScale = !showOutsideScale;
                draw();
            }}"
        >
            non-scale notes {showOutsideScale ? toggleOnIcon : toggleOffIcon}
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
        <MetronomeButton {tempo} accent="{4}" />
    </div>
</main>

<style>
    /* adjust color legend position */
    div :global(figure > div) {
        margin-left: 100px;
    }
</style>