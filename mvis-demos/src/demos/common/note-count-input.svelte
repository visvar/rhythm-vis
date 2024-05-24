<script>
    export let value;
    export let callback = () => {};
    export let label = 'note count';
    export let title =
        'The number of most recently played notes that are shown';
    export let min = 10;
    export let max = 500;
</script>

<label {title}>
    {label}
    <input
        type="number"
        bind:value
        on:change="{callback}"
        step="10"
        {min}
        {max}
        style="width: 55px"
    />
</label>
