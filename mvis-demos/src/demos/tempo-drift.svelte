<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import saveAs from 'file-saver';
    import { Utils } from 'musicvis-lib';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { secondsPerBeatToBpm } from '../lib/lib';

    let width = 1000;
    let height = 600;
    let container;
    let midiDevices = [];
    // settings
    let tempo = 120;
    let binNote = 64;
    let filterNote = 0;
    let barLimit = 50;
    // data
    let firstTimeStamp = 0;
    let noteOnTimes = [];
    let estimatedTempo = 0;

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
        if (noteOnTimes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        noteOnTimes.push(noteInSeconds);
        draw();
    };

    const draw = () => {
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        const sixteenth = quarter / 4;
        const eighth = quarter / 2;
        const half = quarter * 2;
        const whole = quarter * 4;
        const rules = [0, sixteenth, eighth, quarter, half];
        const rulesText = ['0', '𝅘𝅥𝅯', '𝅘𝅥𝅮', '𝅘𝅥', '𝅗𝅥'];
        // get inter-onset intervals
        let iois = noteOnTimes.map((d, i) =>
            i === 0 ? 0 : d - noteOnTimes[i - 1],
        );
        if (filterNote !== 0) {
            const minSize = whole / filterNote;
            iois = iois.filter((d) => d >= minSize);
        }
        // round bars' height to make view clearer
        let binnedIois = iois;
        if (binNote !== 0) {
            const binSize = whole / binNote;
            binnedIois = iois.map((d) => Math.round(d / binSize) * binSize);
        }
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 35,
            marginRight: 1,
            x: {
                axis: false,
            },
            y: {
                ticks: rules,
                tickFormat: (d) => {
                    const index = rules.indexOf(d);
                    return rulesText[index];
                },
                domain: [0, half * 1.1],
                tickSize: 0,
            },
            marks: [
                Plot.barY(binnedIois.slice(-barLimit), {
                    x: (d, i) => i,
                    y: (d) => d,
                    fill: '#ddd',
                    inset: 0,
                    dx: 0.5,
                }),
                Plot.ruleY(rules, { stroke: '#888' }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);

        // tempo estimation
        const lastNotes = iois
            .filter((d) => d > 0.8 * sixteenth && d < 1.25 * quarter)
            .slice(-24)
            .map((d) =>
                d < 0.6 * quarter ? d * 2 : d > 1.5 * quarter ? d / 2 : d,
            );
        estimatedTempo = secondsPerBeatToBpm(d3.mean(lastNotes));
    };

    const exportData = () => {
        const data = {
            tempo,
            binNote,
            filterNote,
            barLimit,
            noteOnTimes,
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
            noteOnTimes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            tempo = json.tempo;
            binNote = json.binNote;
            filterNote = json.filterNote;
            barLimit = json.barLimit;
            noteOnTimes = json.noteOnTimes;
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
    <h2>Tempo Drift</h2>
    <p class="explanation">
        Connect a MIDI instrument (currently {midiDevices.length} connected), choose
        your tempo, and start playing. The time between two note onsets will be shown
        as a bar, so you can see how well you still hit, for example, quarter notes
        after playing for some time. Bar heights are either exact or rounded to the
        closest, for example, 64th note (binning dropdown). You can filter very short
        inter-note times, which happen whan playing two notes at roughly the same
        time as in a chord.
    </p>
    <div class="control">
        <label title="The tempo in beats per minute (bpm)">
            tempo
            <input
                type="number"
                bind:value="{tempo}"
                on:change="{draw}"
                step="1"
                min="10"
                max="400"
                style="width: 55px"
            />
        </label>
        <label
            title="You can change between seeing exact bar heights and binned (rounded) heights."
        >
            binning
            <select bind:value="{binNote}" on:change="{draw}">
                <option value="{0}">off</option>
                {#each [16, 32, 64, 128] as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
        <label
            title="You can filter out bars that are shorter than a given note duration."
        >
            filtering
            <select bind:value="{filterNote}" on:change="{draw}">
                <option value="{0}">off</option>
                {#each [16, 32, 64, 128] as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
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
    {#if estimatedTempo}
        <div>estimated: {estimatedTempo.toFixed(1)} bpm</div>
    {/if}
    <div class="control">
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    noteOnTimes = [];
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
    div :global(text) {
        font-size: 32px;
    }
</style>