<script>
    export let notes = [];
    export let saveToStorage;
    export let callback = () => {};
</script>

<button
    title="Clear all played notes"
    on:click="{() => {
        if (notes.length === 0 || confirm('Reset played notes?')) {
            saveToStorage();
            notes = [];
            callback();
        }
    }}"
>
    reset
</button>
