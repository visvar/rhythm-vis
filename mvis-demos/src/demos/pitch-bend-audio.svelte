<script>
    import { onDestroy, onMount } from 'svelte';
    import * as Plot from '@observablehq/plot';
    import { PitchDetector } from 'pitchy';
    import { Midi, Note } from '@tonaljs/tonal';
    import * as d3 from 'd3';
    import { toggleOffIcon, toggleOnIcon } from '../lib/icons';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import example from '../example-recordings/pitch-bend-audio.json';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 600;
    let container;
    let analyserNode;
    let detector;
    let timeout;
    const waitTime = 16;
    let paused = false;
    let firstTimeStamp = performance.now();
    let audioContext = new window.AudioContext();
    // settings
    let pastTime = 10;
    let ignoreOctave = true;
    let minVolumeDecibels = -20;
    // data
    let bendValues = [];
    let lastValidPitch = 0;

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
        draw();
        timeout = requestAnimationFrame(() => updatePitch(input, sampleRate));
    }

    const draw = () => {
        if (!container) {
            return;
        }
        container.textContent = '';
        let now;
        if (bendValues.length > 0) {
            now = bendValues.at(-1).time;
        } else {
            now = (performance.now() - firstTimeStamp) / 1000;
        }
        const minTime = now - pastTime;
        // plot pitch as MIDI number
        const lastSecond = 1000 / waitTime;
        let medianOfLast = Math.round(
            d3.median(bendValues.slice(-lastSecond), (d) => d.actualMidi),
        );
        // make sure we keep a valid number
        if (isNaN(medianOfLast)) {
            medianOfLast = lastValidPitch;
        } else {
            lastValidPitch = medianOfLast;
        }
        const tickFormat = (d) =>
            Math.floor(d) === d
                ? Midi.midiToNoteName(d, {
                      pitchClass: ignoreOctave,
                      sharps: true,
                  })
                : '';
        const plot2 = Plot.plot({
            width,
            height,
            // marginLeft: 80,
            marginBottom: 50,
            padding: 0,
            x: {
                domain: [minTime, now],
                label: 'time in seconds',
            },
            y: {
                domain: ignoreOctave
                    ? [0, 12]
                    : [medianOfLast - 5, medianOfLast + 5],
                label: ignoreOctave ? 'chroma' : 'pitch',
                grid: true,
            },
            marks: [
                Plot.line(bendValues, {
                    x: 'time',
                    y: ignoreOctave ? 'actualMidiChroma' : 'actualMidi',
                    clip: true,
                    // smooth a bit
                    curve: 'basis',
                }),
                Plot.axisY({
                    anchor: 'left',
                    tickFormat,
                }),
                Plot.axisY({
                    anchor: 'right',
                    tickFormat,
                }),
            ],
        });
        container.appendChild(plot2);
    };

    const getPitchFromAudio = () => {
        analyserNode = audioContext.createAnalyser();
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext.createMediaStreamSource(stream).connect(analyserNode);
            detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
            detector.minVolumeDecibels = minVolumeDecibels;
            const input = new Float32Array(detector.inputLength);
            updatePitch(input, audioContext.sampleRate);
        });
        draw();
    };

    onMount(getPitchFromAudio);

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            pastTime,
            firstTimeStamp,
            minVolumeDecibels,
            ignoreOctave,
            bendValues,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        if (
            bendValues.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            // pause first
            paused = true;
            cancelAnimationFrame(timeout);
            // if (bendValues.length > 0) {
            //     saveToStorage();
            // }
            // load
            pastTime = json.pastTime;
            firstTimeStamp = json.firstTimeStamp;
            minVolumeDecibels = json.minVolumeDecibels;
            ignoreOctave = json.ignoreOctave ?? false;
            bendValues = json.bendValues;
            draw();
        }
    };

    // too much data
    // const saveToStorage = () => {
    //     if (bendValues.length > 0) {
    //         localStorageAddRecording(demoInfo.id, getExportData());
    //     }
    // };

    onDestroy(() => {
        clearTimeout(timeout);
        cancelAnimationFrame(timeout);
        // saveToStorage();
    });
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Allow microphone access and play pitch bends or vibratos. The line chart
        below shows how far you bend up and down over time.
    </p>
    <div class="control">
        <button
            style="width: 75px"
            on:click="{() => {
                paused = !paused;
                if (!paused) {
                    getPitchFromAudio();
                } else {
                    cancelAnimationFrame(timeout);
                }
            }}"
        >
            {paused ? 'play' : 'pause'}
        </button>
        <label>
            past seconds
            <input
                type="number"
                bind:value="{pastTime}"
                on:change="{draw}"
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
            title="When ignoring the octave, the lower visualization will only show the note's chroma from C to B"
            on:click="{() => {
                ignoreOctave = !ignoreOctave;
                draw();
            }}"
        >
            octave {!ignoreOctave ? toggleOnIcon : toggleOffIcon}
        </button>
        <button
            title="Press this button if your browser prevents audio access because there needs to be a user interaction first"
            on:click="{() => {
                audioContext.resume();
                getPitchFromAudio();
            }}"
        >
            resume
        </button>
    </div>
    <div class="visualization" bind:this="{container}"></div>
    <div class="control">
        <ResetNotesButton
            bind:notes="{bendValues}"
            saveToStorage="{// otherwise too much data
            () => {}}"
            callback="{() => {
                firstTimeStamp = performance.now();
                draw();
            }}"
        />
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <!-- <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} /> -->
    </div>
</main>
