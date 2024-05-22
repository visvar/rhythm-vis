<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { Note } from '@tonaljs/tonal';

    let width = 1000;
    let height = 280;
    let stringCount = 6;
    let fretCount = 24;
    // E standard tuning, strings start at high E
    let tuningPitches = [64, 59, 55, 50, 45, 40];
    let container;
    let midiDevices = [];
    // settings

    // data
    let notes = [];

    // domain knowledge

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
        const string = e.message.channel - 1;
        const note = {
            // ...e.note,
            number: e.note.number,
            velocity: e.rawVelocity,
            time: e.timestamp,
            channel: e.message.channel,
            string,
            fret: e.note.number - tuningPitches[string],
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        // TODO: filter notes which are too close together
        // TODO: filter notes with low velocity
        // TODO: allow filtering over time
        const tuningNotes = tuningPitches.map(Note.fromMidiSharps);
        const data = notes.map((d) => {
            const string = d.channel - 1;
            return {
                ...d,
                string,
                fret: d.number - tuningPitches[string],
            };
        });
        const cellSize = (width - 100) / 25;
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 60,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: d3.range(0, fretCount + 1),
                ticks: d3.range(0, fretCount + 1),
                tickSize: 0,
            },
            y: {
                domain: d3.range(0, stringCount),
                tickFormat: (d) => tuningNotes[d],
                tickSize: 0,
            },
            color: {
                legend: true,
                marginLeft: 100,
                width: 400,
                scheme: 'blues',
            },
            marks: [
                //  frets
                Plot.ruleX(d3.range(0, fretCount + 1), {
                    stroke: '#ddd',
                    dx: cellSize / 2,
                }),
                // strings
                Plot.ruleY(d3.range(0, stringCount), {
                    stroke: '#ddd',
                    strokeWidth: (d) => Math.sqrt(d + 1),
                }),
                // inlay dots
                Plot.dot([3, 5, 7, 9, 15, 17, 19, 21], {
                    x: (d) => d,
                    y: 2,
                    dy: cellSize / 2,
                    fill: '#ddd',
                    r: 8,
                }),
                Plot.dot([12, 12, 24, 24], {
                    x: (d) => d,
                    y: (d, i) => (i % 2 === 0 ? 1 : 3),
                    dy: cellSize / 2,
                    fill: '#ddd',
                    r: 8,
                }),
                // heatmap
                Plot.cell(
                    data,
                    Plot.group(
                        { fill: 'count' },
                        {
                            x: 'fret',
                            y: 'string',
                            fill: 'count',
                            inset: 5,
                            rx: '50%',
                            tip: true,
                        },
                    ),
                ),
            ],
        });

        container.textContent = '';
        container.appendChild(plot);
    };

    // const exportData = () => {
    //     const data = {
    //         useColors,
    //         notes,
    //     };
    //     const json = JSON.stringify(data, undefined, 2);
    //     const blob = new Blob([json], {
    //         type: 'text/plain;charset=utf-8',
    //     });
    //     saveAs(blob, 'tempo-drift.json');
    // };

    // const importData = async (e) => {
    //     const file = e.target.files[0];
    //     const text = await file.text();
    //     const json = JSON.parse(text);
    //     if (
    //         notes.length === 0 ||
    //         confirm('Import data and overwrite currently unsaved data?')
    //     ) {
    //         useColors = json.useColors;
    //         notes = json.notes;
    //         draw();
    //     }
    // };

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
    <h2>Fretboard Heatmap</h2>
    <p class="explanation">
        Connect a MIDI guitar and start playing. The heatmap below shows how
        often you played each fretboard position.
    </p>
    <div class="control">
        <!-- <label>
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
        <!-- <button title="Export all data and settings" on:click="{exportData}">
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
        /> -->
    </div>
</main>
