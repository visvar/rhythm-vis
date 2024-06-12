<script>
    import { onMount } from 'svelte';
    import { Canvas, Utils } from 'musicvis-lib';
    import * as kde from 'fast-kde';
    import * as d3 from 'd3';
    import ImportButton from './common/import-button.svelte';
    import ExportButton from './common/export-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { clamp } from '../lib/lib';
    import { BIN_NOTES, GRIDS } from '../lib/music';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import MidiInput from './common/midi-input.svelte';
    import example from '../example-recordings/sub-division.json';

    /**
     * TODO:
     * - metric for spread
     * - metric for mistake
     * - metric for trend to early/late
     * - interpolate first and last point (pad and add?)
     * - fill up x of KDE to fill whole circle
     */

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    const TWO_PI = Math.PI * 2;

    let canvas;
    let width = 1000;
    let height = 1000;
    // settings
    let tempo = 120;
    let grid = GRIDS[0];
    let binNote = 64;
    let adjustTime = 0;
    let noteTickLimit = 1;
    let showKde = false;
    // data
    let firstTimeStamp = 0;
    let noteOnTimes = [];

    const noteOn = (e) => {
        if (noteOnTimes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        noteOnTimes.push(noteInSeconds);
        draw();
    };

    /**
     * Allow controlling vis with a MIDI knob
     * @param e MIDI controllchange event
     */
    const controlChange = (e) => {
        const c = e.controller.number;
        if (c === 14) {
            // tempo
            tempo = clamp(e.rawValue, 0, 120) + 60;
        } else if (c === 15) {
            // grid
            grid =
                GRIDS[clamp(Math.floor(e.rawValue / 5), 0, GRIDS.length - 1)];
        } else if (c === 16) {
            // binning
            binNote =
                BIN_NOTES[
                    clamp(Math.floor(e.rawValue / 5), 0, BIN_NOTES.length - 1)
                ];
        } else if (c === 17) {
            // adjust
            adjustTime = (clamp(e.rawValue, 0, 100) - 50) / 100;
        } else if (c === 18) {
            // note ticks
            noteTickLimit = Math.round(clamp(e.rawValue * 2, 0, 200));
        }
        draw();
    };

    const draw = () => {
        const cx = width / 2;
        const cy = height / 2;
        const r = width * 0.4;
        const r2 = r * 0.8;
        const r3 = r * 0.9;
        const r4 = r * 1.1;
        const r5 = r * 0.95;
        // offset in radians for 0 on top
        const topOffs = Math.PI / 2;
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
        // ctx.fillRect(0, 0, width, height);

        const [grid1, grid2] = grid.split(':').map((d) => +d);

        // number of seconds for a fill circle rotation
        const circleSeconds = Utils.bpmToSecondsPerBeat(tempo) * grid1;

        const notes = noteOnTimes.map((d) => d + adjustTime);

        const clamped = notes.map((d) => d % circleSeconds);
        const noteAngles = clamped.map((d) => (d / circleSeconds) * TWO_PI);
        const maxBinHeight = width * 0.08;

        // draw histogram
        if (!showKde) {
            // for 3/4 bars there are less bins
            const binCount = (binNote * grid1) / 4;
            ctx.fillStyle = '#f8f8f8';
            ctx.strokeStyle = '#aaa';
            const bin = d3
                .bin()
                .domain([0, TWO_PI])
                .thresholds(
                    d3.range(binCount).map((d) => (d / binCount) * TWO_PI),
                );
            const binned = bin(noteAngles);
            const maxBin = d3.max(binned, (d) => d.length);
            for (const b of binned) {
                if (b.length === 0) {
                    continue;
                }
                const binHeight = (b.length / maxBin) * maxBinHeight;
                const binR = r + binHeight;
                const angle1 = b.x0 - topOffs;
                const dx = Math.cos(angle1);
                const dy = Math.sin(angle1);
                const angle2 = b.x1 - topOffs;
                const dx2 = Math.cos(angle2);
                const dy2 = Math.sin(angle2);
                ctx.beginPath();
                ctx.moveTo(cx + dx * r, cy + dy * r);
                ctx.lineTo(cx + dx * binR, cy + dy * binR);
                ctx.arc(cx, cy, binR, angle1, angle2);
                ctx.lineTo(cx + dx2 * r, cy + dy2 * r);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // draw KDE
        if (showKde && noteAngles.length > 0) {
            let bandwidth = 4 / binNote;
            let pad = 0;
            let bins = 360;
            const density1d = kde.density1d(noteAngles, {
                bandwidth,
                pad,
                bins,
            });
            const points = density1d.bandwidth(bandwidth);
            const maxValue = d3.max([...points], (d) => d.y);
            // smooth around first and last point
            // console.log([...points]);
            ctx.beginPath();
            let i = 0;
            for (const p of points) {
                const angle = p.x - topOffs;
                const rp = r + (p.y / maxValue) * maxBinHeight;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);
                ctx.lineTo(cx + dx * rp, cy + dy * rp);
            }
            ctx.closePath();
            ctx.fillStyle = '#e4f0fa';
            ctx.fill();
            ctx.strokeStyle = '#aaa';
            ctx.stroke();
        }

        // draw notes
        if (noteTickLimit > 0) {
            ctx.lineWidth = 3;
            const color = (d) => d3.interpolateViridis(1 - d);
            const lastNotes = notes.slice(-noteTickLimit);
            for (const [i, n] of lastNotes.entries()) {
                const angle = (n / circleSeconds) * TWO_PI - topOffs;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);
                ctx.strokeStyle = color(i / lastNotes.length);
                ctx.beginPath();
                ctx.moveTo(cx + dx * r, cy + dy * r);
                ctx.lineTo(cx + dx * r4, cy + dy * r4);
                ctx.stroke();
            }
        }

        // grid
        ctx.strokeStyle = '#aaa';
        ctx.fillStyle = 'white';
        Canvas.drawCircle(ctx, cx, cy, r);
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        // grid angles
        const coarseGridAngles = d3
            .range(grid1)
            .map((d) => (TWO_PI / grid1) * d - topOffs);
        const fineGridAngles = d3
            .range(grid1 * grid2)
            .map((d) => (TWO_PI / (grid1 * grid2)) * d - topOffs);
        // draw grid ticks
        ctx.beginPath();
        ctx.lineWidth = 2;
        for (const g of coarseGridAngles) {
            const dx = Math.cos(g);
            const dy = Math.sin(g);
            ctx.moveTo(cx + dx * r2, cy + dy * r2);
            ctx.lineTo(cx + dx * r5, cy + dy * r5);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const g of fineGridAngles) {
            const dx = Math.cos(g);
            const dy = Math.sin(g);
            ctx.moveTo(cx + dx * r3, cy + dy * r3);
            ctx.lineTo(cx + dx * r5, cy + dy * r5);
        }
        ctx.stroke();
    };

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            tempo,
            grid,
            binNote,
            adjustTime,
            noteTickLimit,
            showKde,
            noteOnTimes,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            noteOnTimes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            loadExample(json);
        }
    };

    const loadExample = (json) => {
        tempo = json.tempo;
        grid = json.grid;
        binNote = json.binNote;
        adjustTime = json.adjustTime;
        noteTickLimit = json.noteTickLimit ?? 0;
        noteOnTimes = json.noteOnTimes;
        showKde = json.showKde ?? false;
        draw();
    };

    onMount(draw);
</script>

<main class="demo">
    <h2>{demoInfo.title}</h2>
    <p class="explanation">
        Connect a MIDI instrument, choose your tempo and subdivision, and start
        playing. The bar chart will show you how often you hit each time bin and
        the last notes will be shown as ticks that fade out one new notes come
        in (from red for new to blue for old). You can play freely, use the
        integrated metronome, or play a song in the background (in another tab).
        All notes will be timed relative to the first one, but you can adjust
        all notes to make them earlier or later in case you messed up the first
        one.
        <i> Try playing without looking, focus on the metronome. </i>
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid
            <select bind:value="{grid}" on:change="{draw}">
                {#each GRIDS as g}
                    <option value="{g}">{g}</option>
                {/each}
            </select>
        </label>
        <label
            title="The width of each bar in rhythmic units. For example, each bin could be a 32nd note wide."
        >
            binning
            <select bind:value="{binNote}" on:change="{draw}">
                {#each BIN_NOTES as g}
                    <option value="{g}">1/{g} note</option>
                {/each}
            </select>
        </label>
        <label title="Shift all notes by an amount in seconds">
            adjust
            <input
                type="number"
                bind:value="{adjustTime}"
                on:change="{draw}"
                step="0.01"
                min="-2"
                max="2"
                style="width: 55px"
            />
        </label>
        <label title="The number of most recent notes that are shown as ticks.">
            note ticks
            <input
                type="number"
                bind:value="{noteTickLimit}"
                on:change="{draw}"
                step="1"
                min="0"
                max="100"
                style="width: 55px"
            />
        </label>
        <button
            title="Toggle between bars and area"
            on:click="{() => {
                showKde = !showKde;
                draw();
            }}"
        >
            {showKde ? 'area' : 'bars'}
        </button>
    </div>
    <div
        class="visualization"
        on:touchstart="{() => noteOn({ timestamp: performance.now() })}"
    >
        <canvas
            bind:this="{canvas}"
            style="width: {width}px; height: {height}px"
        ></canvas>
    </div>
    <div class="control">
        <ResetNotesButton bind:notes="{noteOnTimes}" callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
        <button on:click="{() => loadExample(example)}"> example </button>
        <MetronomeButton {tempo} accent="{+grid.split(':')[0]}" />
    </div>
    <PcKeyboardInput
        key=" "
        callback="{() => noteOn({ timestamp: performance.now() })}"
    />
    <MidiInput {noteOn} {controlChange} />
</main>
