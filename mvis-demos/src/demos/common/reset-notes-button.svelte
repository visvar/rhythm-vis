<script>
    export let notes = [];
    export let callback = () => {};
</script>

<button
    title="Clear all played notes"
    on:click="{() => {
        if (notes.length === 0 || confirm('Reset played notes?')) {
            notes = [];
            callback();
        }
    }}"
>
    reset
</button>
