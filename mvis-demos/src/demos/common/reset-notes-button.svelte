<script>
    export let notes = [];
    export let callback = () => {};
</script>

<button
    title="Clear all played notes"
    on:click="{() => {
        if (confirm('Reset played notes?')) {
            notes = [];
            callback();
        }
    }}"
>
    reset
</button>
