<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import { Utils } from 'musicvis-lib';
    import * as Plot from '@observablehq/plot';
    import * as kde from 'fast-kde';
    import * as d3 from 'd3';
    import ImportButton from './common/import-button.svelte';
    import ExportButton from './common/export-button.svelte';
    import MetronomeButton from './common/metronome-button.svelte';
    import TempoInput from './common/tempo-input.svelte';
    import { downloadJsonFile, parseJsonFile } from '../lib/json';
    import ResetNotesButton from './common/reset-notes-button.svelte';
    import { BIN_NOTES, GRIDS } from '../lib/music';
    import PcKeyboardInput from './common/pc-keyboard-input.svelte';
    import InsideTextButton from './common/inside-text-button.svelte';

    /**
     * contains the demo meta information defined in App.js
     */
    export let demoInfo;

    let width = 1000;
    let midiDevices = [];
    let containerLeft;
    let containerRight;
    // settings
    let tempo = 120;
    let gridLeft = GRIDS[0];
    let gridRight = GRIDS[0];
    let binNote = 64;
    let adjustTime = 0;
    let middleNote = 69;
    let showKde = false;
    // data
    let firstTimeStamp = 0;
    let notes = [];

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
        if (notes.length === 0) {
            firstTimeStamp = e.timestamp;
        }
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        notes.push({
            time: noteInSeconds,
            number: e.note.number,
        });
        draw();
    };

    const drawHand = (left = true) => {
        const grid = left ? gridLeft : gridRight;
        const [grid1, grid2] = grid.split(':').map((d) => +d);
        const quarter = Utils.bpmToSecondsPerBeat(tempo);
        const clamped = notes
            .filter(
                // only look at left OR right hand
                (d) =>
                    (left && d.number < middleNote) ||
                    (!left && d.number >= middleNote),
            )
            .map((d) => ((d.time + adjustTime) / quarter) % grid1);

        // KDE
        let kdePoints = [];
        if (clamped.length > 0) {
            let bandwidth = 4 / binNote;
            let pad = 1;
            let bins = width / 2;
            const density1d = kde.density1d(clamped, {
                bandwidth,
                pad,
                bins,
            });
            kdePoints = density1d.bandwidth(bandwidth);
        }

        const coarseGrid = d3.range(0, grid1 + 1, 1);
        const fineGrid = d3.range(0, grid1 * grid2, 1 / grid2);

        const plot = Plot.plot({
            width,
            height: 90,
            marginLeft: 60,
            marginBottom: 0,
            padding: 0,
            x: {
                label: null,
                domain: [0, grid1],
                ticks: [],
            },
            y: {
                axis: false,
                reverse: !left,
            },
            marks: [
                showKde
                    ? Plot.areaY(kdePoints, {
                          x: 'x',
                          y: 'y',
                          fill: (d) => '#e4f0fa',
                          clip: true,
                      })
                    : Plot.rectY(
                          clamped,
                          Plot.binX(
                              { y: 'count' },
                              {
                                  x: (d) => d,
                                  fill: '#ccc',
                                  thresholds: d3.range(
                                      0,
                                      grid1 + 1,
                                      4 / binNote,
                                  ),
                              },
                          ),
                      ),

                Plot.ruleY([0]),
                // beat grid
                Plot.tickX(fineGrid, {
                    stroke: '#888',
                }),
                Plot.tickX(coarseGrid, {
                    stroke: '#888',
                    strokeWidth: 3,
                }),
            ],
        });

        const container = left ? containerLeft : containerRight;
        container.textContent = '';
        container.appendChild(plot);
    };

    const draw = () => {
        drawHand(true);
        drawHand(false);
    };

    /**
     * export data to a JSON file as download
     */
    const exportData = () => {
        const data = {
            tempo,
            gridLeft,
            gridRight,
            binNote,
            adjustTime,
            noteOnTimes: notes,
        };
        downloadJsonFile(demoInfo.id, data);
    };

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        if (
            notes.length === 0 ||
            confirm('Import data and overwrite currently unsaved data?')
        ) {
            const json = await parseJsonFile(e);
            tempo = json.tempo;
            gridLeft = json.gridLeft;
            gridRight = json.grid;
            binNote = json.binNote;
            adjustTime = json.adjustTime ?? 0;
            notes = json.noteOnTimes;
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
        Connect a MIDI keyboard and start playing to the metronome. The chart
        will show you how a summary of where your notes started, the top one is
        for your left hand (keys left of the middle A) and the bottom one for
        your right hand. For example, you can try to play eighths with your left
        and quarter triplets with your right hand (click
        <InsideTextButton
            onclick="{() => {
                gridLeft = '4:2';
                gridRight = '4:3';
                draw();
            }}"
        >
            here
        </InsideTextButton>
        to set this up). If you do not have a MIDI keyboard, you can press the
        <code>f</code>
        key on your PC keyboard for left and <code>j</code> for right.
    </p>
    <div class="control">
        <TempoInput bind:value="{tempo}" callback="{draw}" />
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid (left)
            <select bind:value="{gridLeft}" on:change="{draw}">
                {#each GRIDS as g}
                    <option value="{g}">{g}</option>
                {/each}
            </select>
        </label>
        <label
            title="The whole circle is one bar, you can choose to divide it by 3 or 4 quarter notes and then further sub-divide it into, for example, triplets"
        >
            grid (right)
            <select bind:value="{gridRight}" on:change="{draw}">
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
    <div class="visualization" bind:this="{containerLeft}"></div>
    <div class="visualization" bind:this="{containerRight}"></div>
    <div class="control">
        <ResetNotesButton bind:notes callback="{draw}" />
        <ExportButton exportFunction="{exportData}" />
        <ImportButton importFunction="{importData}" />
        <MetronomeButton {tempo} accent="{+gridLeft.split(':')[0]}" />
    </div>
    <PcKeyboardInput
        key="f"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 0 } })}"
    />
    <PcKeyboardInput
        key="j"
        callback="{() =>
            noteOn({ timestamp: performance.now(), note: { number: 127 } })}"
    />
</main>

<style>
    code {
        background-color: #eee;
        padding: 4px;
        border-radius: 4px;
    }
</style>
