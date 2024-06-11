<script>
    import { onDestroy, onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import ExportButton from './common/export-button.svelte';
    import ImportButton from './common/import-button.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import { PitchDetector } from 'pitchy';
    import { Midi, Note } from '@tonaljs/tonal';
    import ResetNotesButton from './common/reset-notes-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 500;
    let container;
    let audioContext;
    let analyserNode;
    let detector;
    let timeout;
    const waitTime = 16;
    // settings
    let pastTime = 10;
    let minVolumeDecibels = -25;
    // data
    let firstTimeStamp = 0;
    let bendValues = [];

    function updatePitch(input, sampleRate) {
        analyserNode.getFloatTimeDomainData(input);
        const detected = detector.findPitch(input, sampleRate);
        const pitch = detected[0];
        const clarity = detected[1];
        const note = Note.fromFreq(pitch);
        const noteMidi = Note.midi(note);
        const actualMidi = Midi.freqToMidi(pitch);
        const centsOffset = (actualMidi - noteMidi) * 100;
        const noteInSeconds = (performance.now() - firstTimeStamp) / 1000;
        const bend = {
            time: noteInSeconds,
            pitch,
            noteMidi,
            actualMidi,
            actualMidiChroma: actualMidi % 12,
            centsOffset,
            clarity,
        };
        bendValues.push(bend);
        bendValues = bendValues.slice(-(1000 / waitTime) * pastTime);
        draw();
        timeout = requestAnimationFrame(() => updatePitch(input, sampleRate));
    }

    const draw = () => {
        container.textContent = '';
        const now = (performance.now() - firstTimeStamp) / 1000;
        const minTime = now - pastTime;
        const plot2 = Plot.plot({
            width,
            height,
            marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: [minTime, now],
                label: 'time in seconds',
            },
            y: {
                domain: [-50, 50],
                label: 'offset in cents',
                grid: true,
            },
            marks: [
                Plot.ruleY([0]),
                Plot.line(bendValues, {
                    x: 'time',
                    y: 'centsOffset',
                    clip: true,
                    // smooth a bit
                    curve: 'basis',
                }),
                Plot.line(bendValues, {
                    x: 'time',
                    y: 'centsOffset',
                    clip: true,
                    // smooth a bit
                    curve: 'basis',
                }),
            ],
        });
        container.appendChild(plot2);
    };

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            pastTime,
            firstTimeStamp,
            minVolumeDecibels,
            bendValues,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            bendValues.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            pastTime = json.pastTime;
            firstTimeStamp = json.firstTimeStamp;
            minVolumeDecibels = json.minVolumeDecibels;
            bendValues = json.bendValues;
            draw();
        }
    };

    onMount(() => {
        firstTimeStamp = performance.now();
        audioContext = new window.AudioContext();
        analyserNode = audioContext.createAnalyser();
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext.createMediaStreamSource(stream).connect(analyserNode);
            detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
            detector.minVolumeDecibels = minVolumeDecibels;
            const input = new Float32Array(detector.inputLength);
            updatePitch(input, audioContext.sampleRate);
        });
        draw();
    });

    onDestroy(() => {
        clearTimeout(timeout);
        cancelAnimationFrame(timeout);
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Allow microphone access and play pitch bends or vibratos. The line chart
        below shows how far you bend up and down over time.
    </p>
    {#if bendValues.length > 0}
        <p>
            Current closest note: {Midi.midiToNoteName(
                bendValues.at(-1).noteMidi,
            )}
        </p>
    {/if}
    <div class="control">
        <label>
            past seconds
            <input
                type="number"
                bind:value="{pastTime}"
                min="5"
                max="60"
                step="5"
            />
        </label>
        <label
            title="The minimum loudness in decibels for a sound to be registered as input. Lower means fainter notes will be registered but there will be more noise such as octave errors."
        >
            min. decibels
            <input
                type="number"
                bind:value="{minVolumeDecibels}"
                on:change="{() =>
                    (detector.minVolumeDecibels = minVolumeDecibels)}"
                min="-40"
                max="-5"
                step="5"
            />
        </label>
        <button
            title="Press this button if your browser prevents audio access because there needs to be a user interaction first"
            on:click="{() => audioContext.resume()}"
        >
            resume
        </button>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton bind:notes="{bendValues}" callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
    </div>
</main>
