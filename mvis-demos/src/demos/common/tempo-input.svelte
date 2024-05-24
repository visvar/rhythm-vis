<script>
    export let value;
    export let callback = () => {};
    export let label = 'tempo';
    export let title = 'The tempo in beats per minute (bpm)';
</script>

<label {title}>
    {label}
    <input
        type="number"
        bind:value
        on:change="{callback}"
        step="5"
        min="10"
        max="400"
        style="width: 55px"
    />
</label>
