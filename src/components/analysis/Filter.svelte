<script>
    import { max } from 'd3';
    import { drumPitchReplacementMap } from '../../lib/drums';

    export let unfilteredNotes = [];
    export let notes = [];

    $: maxDuration = unfilteredNotes.length
        ? Math.ceil(max(unfilteredNotes, (d) => d.duration))
        : 10;

    $: pitches = [...new Set(unfilteredNotes.map((d) => d.pitch))].sort();
    $: channels = [...new Set(unfilteredNotes.map((d) => d.channel))].sort();

    let velocity = 0;
    let duration = 0;
    let selectedPitches = [];
    let selectedChannels = [];

    const filter = (velocity, duration, selectedPitches, selectedChannels) => {
        const pitchSet = new Set(selectedPitches);
        const channelSet = new Set(selectedChannels);
        notes = unfilteredNotes.filter(
            (d) =>
                d.velocity >= velocity &&
                d.duration >= duration &&
                !pitchSet.has(d.pitch) &&
                !channelSet.has(d.channel)
        );
    };

    $: {
        filter(velocity, duration, selectedPitches, selectedChannels);
    }

    const reset = () => {
        velocity = 0;
        duration = 0;
        selectedPitches = [];
        selectedChannels = [];
    };
</script>

<main>
    <span class="heading">Filter</span>
    <div>
        <label>
            <span>min. velocity</span>
            <input
                bind:value="{velocity}"
                type="range"
                min="0"
                max="1"
                step="0.05"
            />
            <input
                bind:value="{velocity}"
                type="number"
                min="0"
                max="1"
                step="0.05"
            />
        </label>
        <label>
            <span>min. duration</span>
            <input
                bind:value="{duration}"
                type="range"
                min="0"
                max="{maxDuration}"
                step="0.05"
            />
            <input
                bind:value="{duration}"
                type="number"
                min="0"
                max="{maxDuration}"
                step="0.05"
            />
        </label>
        <span>keeping {notes.length} of {unfilteredNotes.length} notes</span>
        <button on:click="{reset}">reset</button>
    </div>
    <label title="Pitches to exclude (select multiple by pressing CTRL)">
        <span>pitches<br />to<br />exclude</span>
        <select bind:value="{selectedPitches}" multiple>
            {#each pitches as pitch}
                <option value="{pitch}">
                    {pitch} / {drumPitchReplacementMap.get(pitch)?.label ?? ''}
                </option>
            {/each}
        </select>
    </label>
    <label title="Channels to exclude (select multiple by pressing CTRL)">
        <span>channels<br />to<br />exclude</span>
        <select bind:value="{selectedChannels}" multiple>
            {#each channels as channel}
                <option value="{channel}">{channel}</option>
            {/each}
        </select>
    </label>
</main>

<style>
    main {
        width: 800px;
        margin: 5px auto;
        padding: 10px 15px 10px 25px;
        border-radius: 5px;
        background: #f8f8f8;
        display: grid;
        grid-template-columns: auto auto auto;
        column-gap: 20px;
    }
    div {
        display: grid;
    }

    .heading {
        grid-column: 1 / span 3;
    }

    input[type='number'] {
        width: 60px;
    }

    label {
        display: inline-grid;
        grid-template-columns: auto auto auto;
        align-items: center;
        justify-items: end;
        gap: 3px;
    }

    select {
        height: 90%;
    }

    button {
        width: min-content;
        margin: 3px auto;
    }
</style>
