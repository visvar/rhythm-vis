<script>
    import PcKeyboardInput from './pc-keyboard-input.svelte';

    export let notes = [];
    export let saveToStorage;
    export let callback = () => {};

    const reset = () => {
        if (notes.length === 0 || confirm('Reset played notes?')) {
            saveToStorage();
            notes = [];
            callback();
        }
    };
</script>

<button title="Clear all played notes (shortcut: r)" on:click="{reset}">
    reset
</button>
<PcKeyboardInput key="r" keyDown="{reset}" />
