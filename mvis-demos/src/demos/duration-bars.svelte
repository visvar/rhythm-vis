<script>
    import { onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import { clamp } from '../lib/lib';
    import { Utils } from 'musicvis-lib';
    import NoteCountInput from './common/note-count-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import ExportButton2 from './common/export-button2.svelte';
    import ImportButton2 from './common/import-button2.svelte';
    import { localStorageAddRecording } from '../lib/localstorage';
    import HistoryButton from './common/history-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import { noteDurations } from '../lib/note-durations';
    import example from '../example-recordings/duration-bars.json';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import TouchInput from './common/touch-input.svelte';
    import { noteEighth, noteHalf, noteQuarter, noteWhole } from '../lib/icons';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import ExerciseDrawer from './common/exercise-drawer.svelte';
    import ToggleButton from './common/toggle-button.svelte';
    import { COLORS } from '../lib/colors';
    import RatingButton from './common/rating-button.svelte';
    import ShareConfigButton from './common/share-config-button.svelte';
    import UndoRedoButton from './common/undo-redo-button.svelte';
    import PageResizeHandler from './common/page-resize-handler.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 900;
    let height = 400;
    let canvas;
    // settings
    let tempo = 60;
    let pastNoteCount = 10;
    let showClosestDuration = false;
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
        const xStep = (width - 10) / pastNoteCount;
        const w = xStep * 0.8;
        const h = height * 0.7;
        const top = 10;
        const bottom = top + h;
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
        ctx.textBaseline = 'middle';

        for (const [index, note] of notes.slice(-pastNoteCount).entries()) {
            // one pie chart per note
            const x = xStep * (index + 0.1) + 10;
            // data part
            ctx.fillStyle = COLORS.accent;
            const ratio = Math.min(note.duration / wholeDuration, 1);
            const filled = h * ratio;
            ctx.fillRect(x, bottom - filled, w, filled);
            // get closest duration
            let bestFitDuration = null;
            if (note.duration > 0) {
                const bestFit = d3.minIndex(durations, (d) =>
                    Math.abs(note.duration - d.seconds),
                );
                bestFitDuration = durations[bestFit];
                if (showClosestDuration) {
                    ctx.fillStyle = COLORS.accentDark;
                    const ratio = Math.min(
                        bestFitDuration.seconds / wholeDuration,
                        1,
                    );
                    const filled = h * ratio;
                    ctx.fillRect(x, bottom - filled, w / 2, filled);
                }
            }
            //  if longer than a whole, show in red how much too long
            if (note.duration > wholeDuration) {
                ctx.fillStyle = COLORS.wrong;
                const ratio2 = Math.min(
                    (note.duration - wholeDuration) / wholeDuration,
                    1,
                );
                const filled2 = h * ratio2;
                ctx.fillRect(x, bottom - filled2, w, filled2);
            }
            // frame
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#aaa';
            ctx.fillStyle = '#aaa';
            ctx.strokeRect(x, top, w, h);
            // grid
            ctx.fillRect(x, top + h / 2, w * 0.4, 1);
            for (const g of d3.range(top, top + h, h / 4)) {
                ctx.fillRect(x, g, w * 0.2, 1);
            }
            for (const g of d3.range(top, top + h, h / 8)) {
                ctx.fillRect(x, g, w * 0.1, 1);
            }
            // text
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#666';
            if (note.duration > 0) {
                const bestFit = d3.minIndex(durations, (d) =>
                    Math.abs(note.duration - d.seconds),
                );
                const bestFitDuration = durations[bestFit];
                ctx.textAlign = 'center';
                const cx = x + w / 2;
                ctx.fillText(
                    `closest: ${bestFitDuration.symbol}`,
                    cx,
                    height - 50,
                );
                const percent = (note.duration / bestFitDuration.seconds) * 100;
                ctx.fillText(`${percent.toFixed()}%`, cx, height - 30);
                let rating = '';
                if (percent < 80) {
                    rating = 'too short';
                } else if (percent < 90) {
                    rating = 'short';
                } else if (percent < 110) {
                    rating = 'good!';
                } else if (percent < 120) {
                    rating = 'long';
                } else {
                    rating = 'too long';
                }
                ctx.fillText(`${rating}`, cx, height - 10);
            }
            // labels
            ctx.font = '20px sans-serif';
            if (index === 0) {
                ctx.textAlign = 'right';
                ctx.fillText(noteWhole, x - 5, top);
                ctx.fillText(noteHalf + '.', x - 5, top + h * 0.25);
                ctx.fillText(noteHalf, x - 5, top + h * 0.5);
                ctx.fillText(noteQuarter, x - 5, top + h * 0.75);
                ctx.fillText(noteEighth, x - 5, top + h * 0.875);
            }
        }
    };

    /**
     * Used for exporting and for automatics saving
     */
    const getExportData = () => {
        return {
            tempo,
            pastNoteCount,
            showClosestDuration,
            // data
            notes,
        };
    };

    /**
     * Import data from file or example
     */
    const loadData = (json) => {
        saveToStorage();
        tempo = json.tempo;
        pastNoteCount = json.pastNoteCount;
        showClosestDuration = json.showClosestDuration;
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
        Set a tempo and try to play different note durations (whole, half,
        quarter, eighth). You can also try dotted notes. Each note will be shown
        as a partially filled bar, that shows how much of a whole note you
        played. For example, if you tried to play a half note, the bar should be
        half full. If you play longer than a whole note, the addtional time will
        be shown in red.
    </p>
    <ExerciseDrawer>
        <p>
            1) Play a quarter note 𝅘𝅥, a half note 𝅗𝅥, a dotted half note 𝅗𝅥., and
            a whole note 𝅝.
        </p>
    </ExerciseDrawer>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <NoteCountInput
            bind:value="{pastNoteCount}"
            callback="{draw}"
            step="{1}"
            min="{1}"
        />
        <ToggleButton
            bind:checked="{showClosestDuration}"
            callback="{draw}"
            label="show closest duration"
            title="Show the closest note duration as a second bar"
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
        <UndoRedoButton bind:data="{notes}" callback="{draw}" />
        <ResetNotesButton
            {saveToStorage}
            bind:notes
            callback="{() => {
                openNoteMap = new Map();
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
    <PageResizeHandler callback="{draw}" />
</main>
