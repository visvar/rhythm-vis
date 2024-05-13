<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note, Scale } from '@tonaljs/tonal';
    import { Midi } from 'musicvis-lib';

    let width = 1000;
    let height = 650;
    let container;
    let midiDevices = [];
    // settings
    let root = 'A';
    let scale = 'minor pentatonic';
    let useColors = true;
    let showOutsideScale = true;
    // data
    let notes = [];

    // domain knowledge
    const noteNames = Midi.NOTE_NAMES_FLAT;
    // see https://muted.io/intervals-chart/
    // TODO: go up to 24?
    const intervalNames = [];

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
        // console.log(e.note);
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
        // note chroma from 0 to 11 (C to B)
        const chroma = notes.map((d) => d.number % 12);
        // steps from root to note
        const rootOffsets = chroma.map((d) => {
            const offset = d - rootNr;
            return offset >= 0 ? offset : offset + 12;
        });
        const grouped = d3
            .groups(rootOffsets, (d) => d)
            .map(([key, grp]) => {
                return { value: key, count: grp.length };
            });
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 120,
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
                label: 'semitones from root',
            },
            marks: [
                Plot.barX(grouped, {
                    x: 'count',
                    y: 'value',
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
            useColors,
            notes,
        };
        const json = JSON.stringify(data, undefined, 2);
        const blob = new Blob([json], {
            type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, 'tempo-drift.json');
    };

    const importData = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const json = JSON.parse(text);
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            useColors = json.useColors;
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
    <h2>Improvisation Intervals</h2>
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
        <button
            title="Use colors for root, in-scale, outside-scale"
            on:click="{() => {
                useColors = !useColors;
                draw();
            }}"
        >
            colors {useColors ? 'on' : 'off'}
        </button>
        <button
            title="Show notes outside the scale"
            on:click="{() => {
                showOutsideScale = !showOutsideScale;
                draw();
            }}"
        >
            non-scale notes {showOutsideScale ? 'shown' : 'hidden'}
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
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    notes = [];
                    draw();
                }
            }}"
        >
            reset
        </button>
        <button title="Export all data and settings" on:click="{exportData}">
            export
        </button>
        <button
            title="Export all data and settings"
            on:click="{() => document.querySelector('#file-input').click()}"
        >
            import
        </button>
        <input
            type="file"
            on:input="{importData}"
            id="file-input"
            style="display: none"
        />
    </div>
</main>

<style>
    /* adjust color legend position */
    div :global(figure > div) {
        margin-left: 100px;
    }
</style>
