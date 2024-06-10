<script>
    import { onDestroy, onMount } from 'svelte';

    export let key = ' ';
    export let callback = () => {};

    const keyDown = (e) => {
        if (e.key === key) {
            e.preventDefault();
            callback();
        }
    };

    onMount(() => {
        document.addEventListener('keydown', keyDown);
    });

    onDestroy(() => {
        document.removeEventListener('keydown', keyDown);
    });
</script>
