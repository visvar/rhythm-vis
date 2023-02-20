<script>
    import { max } from 'd3';

    export let unfilteredNotes = [];
    export let notes = [];

    $: maxDuration = unfilteredNotes.length
        ? Math.ceil(max(unfilteredNotes, (d) => d.duration))
        : 10;
    let velocity = 0;
    let duration = 0;

    const filter = (velocity, duration) => {
        notes = unfilteredNotes.filter(
            (d) => d.velocity >= velocity && d.duration >= duration
        );
    };

    $: {
        filter(velocity, duration);
    }
</script>

<main>
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
</main>

<style>
    main {
        padding: 0 15px;
    }

    input[type='number'] {
        width: 60px;
    }

    label {
        display: inline-grid;
        grid-template-columns: auto auto auto;
        align-items: center;
        justify-items: center;
        gap: 3px;
    }
</style>
