<script>
    import { onDestroy, onMount } from 'svelte';
    import * as d3 from 'd3';
    import { clamp } from '../lib/lib';
    import { Canvas, Utils } from 'musicvis-lib';
    import NoteCountInput from './common/note-count-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import LoadFromStorageButton from './common/load-from-storage-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import { noteDurations } from '../lib/note-durations';
    import example from '../example-recordings/duration-pies.json';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import TouchInput from './common/touch-input.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1200;
    let height = 400;
    let canvas;
    const TWO_PI = 2 * Math.PI;
    // settings
    let tempo = 60;
    let pastNoteCount = 1;
    // data
    let isKeyDown = false;
    $: wholeDuration = Utils.bpmToSecondsPerBeat(tempo) * 4;
    $: durations = noteDurations
        .filter((d) => !d.tuplet)
        .map((d) => {
            return { ...d, seconds: d.beats * (wholeDuration / 4) };
        });
    let notes = [];
    let firstTimeStamp;
    let openNoteMap = new Map();

    const noteOn = (e) => {
        console.log(e);
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = {
            number: e.note.number,
            time: noteInSeconds,
            duration: 0,
        };
        // fix old note if its end was missed
        if (openNoteMap.has(e.note.number)) {
            const oldNote = openNoteMap.get(e.note.number);
            if (oldNote.end === undefined) {
                oldNote.end = noteInSeconds;
            }
        }
        notes = [...notes, note];
        console.log(note);
        openNoteMap.set(e.note.number, note);
        draw();
    };

    const noteOff = (e) => {
        if (openNoteMap.has(e.note.number)) {
            const note = openNoteMap.get(e.note.number);
            const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
            note.end = noteInSeconds;
            note.duration = note.end - note.time;
            console.log(note);
        }
        draw();
    };

    const controlChange = (e) => {
        const clamped = clamp(e.rawValue * 2, 20, 250);
        pastNoteCount = clamped;
        draw();
    };

    const draw = () => {
        const cy = height / 2;
        const xStep = width / pastNoteCount;
        const r = Math.min(xStep * 0.4, height * 0.3);
        const r2 = r * 0.5;
        const r3 = r * 0.75;
        const ctx = canvas.getContext('2d');
        // scale to DPR
        // Get the DPR and size of the canvas
        const dpr = window.devicePixelRatio;
        const rect = canvas.getBoundingClientRect();
        // Set the "actual" size of the canvas
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        // Scale the context to ensure correct drawing operations
        ctx.scale(dpr, dpr);
        // Set the "drawn" size of the canvas
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        // fade-out old data
        ctx.clearRect(0, 0, width, height);

        for (const [index, note] of notes.slice(-pastNoteCount).entries()) {
            // one pie chart per note
            const cx = xStep * (index + 0.5);
            // data part
            ctx.fillStyle = '#d5f3fe';
            const ratio = Math.min(note.duration / wholeDuration, 1);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, -Math.PI / 2, ratio * TWO_PI - Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            //  if longer than a whole, show in red how much too long
            if (note.duration > wholeDuration) {
                ctx.fillStyle = 'crimson';
                const ratio2 = Math.min(
                    (note.duration - wholeDuration) / wholeDuration,
                    1,
                );
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, -Math.PI / 2, ratio2 * TWO_PI - Math.PI / 2);
                ctx.closePath();
                ctx.fill();
            }
            // frame
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#aaa';
            Canvas.drawCircle(ctx, cx, cy, r);
            // grid
            const coarseGridAngles = d3.range(4).map((d) => (d * TWO_PI) / 4);
            const fineGridAngles = d3.range(8).map((d) => (d * TWO_PI) / 8);
            ctx.beginPath();
            for (const g of coarseGridAngles) {
                const dx = Math.cos(g);
                const dy = Math.sin(g);
                ctx.moveTo(cx + dx * r2, cy + dy * r2);
                ctx.lineTo(cx + dx * r, cy + dy * r);
            }
            ctx.lineWidth = 1;
            for (const g of fineGridAngles) {
                const dx = Math.cos(g);
                const dy = Math.sin(g);
                ctx.moveTo(cx + dx * r3, cy + dy * r3);
                ctx.lineTo(cx + dx * r, cy + dy * r);
            }
            ctx.stroke();
            // text
            if (note.duration === 0) {
                continue;
            }
            const bestFit = d3.minIndex(durations, (d) =>
                Math.abs(note.duration - d.seconds),
            );
            const bestFitDuration = durations[bestFit];
            ctx.fillStyle = '#666';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`closest: ${bestFitDuration.symbol}`, cx, height - 50);
            const percent = (note.duration / bestFitDuration.seconds) * 100;
            ctx.fillText(`${percent.toFixed()}%`, cx, height - 30);
            let rating = '';
            if (percent < 80) {
                rating = 'too short';
            } else if (percent < 90) {
                rating = 'a bit short';
            } else if (percent < 110) {
                rating = 'good!';
            } else if (percent < 120) {
                rating = 'a bit long';
            } else {
                rating = 'too long';
            }
            ctx.fillText(`${rating}`, cx, height - 10);
        }
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            pastNoteCount,
            // data
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

    onDestroy(saveToStorage);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Set a tempo and try to play different note durations (whole, half,
        quarter, eighth). You can also try dotted notes. Each note will be shown
        as a pie chart, that shows how much of a whole note you played. For
        example, if you tried to play a half note, the pie chart should be half
        full. If you play longer than a whole note, the addtional time will be
        shown in red.
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <NoteCountInput
            bind:value="{pastNoteCount}"
            callback="{draw}"
            step="{1}"
            min="{1}"
        />
    </div>
    <div class="visualization">
        <canvas
            bind:this="{canvas}"
            style="width: {width}px; height: {height}px"
        ></canvas>
    </div>
    <div class="control">
        <MetronomeButton {tempo} accent="{4}" />
        <button
            title="Clear all played notes"
            on:click="{() => {
                if (confirm('Reset played notes?')) {
                    saveToStorage();
                    notes = [];
                    openNoteMap = new Map();
                    draw();
                }
            }}"
        >
            reset
        </button>
        <ExportButton2 {getExportData} demoId="{demoInfo.id}" />
        <ImportButton2 {loadData} />
        <button on:click="{() => loadData(example)}"> example </button>
        <LoadFromStorageButton demoId="{demoInfo.id}" {loadData} />
    </div>
    <MidiInput {noteOn} {noteOff} {controlChange} />
    <PcKeyboardInput
        key=" "
        keyDown="{() => {
            if (isKeyDown) {
                return;
            }
            isKeyDown = true;
            console.log('keydown');
            noteOn({
                note: { number: 0 },
                timestamp: performance.now(),
            });
        }}"
        keyUp="{() => {
            console.log('keyup');
            isKeyDown = false;
            noteOff({
                note: { number: 0 },
                timestamp: performance.now(),
            });
        }}"
    />
    <TouchInput
        element="{canvas}"
        touchStart="{() => {
            noteOn({
                note: { number: 0 },
                timestamp: performance.now(),
            });
        }}"
        touchEnd="{() => {
            noteOff({
                note: { number: 0 },
                timestamp: performance.now(),
            });
        }}"
    />
</main>
