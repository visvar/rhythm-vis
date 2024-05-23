<script>
    import { onDestroy } from 'svelte';
    import Metronome from '../../lib/Metronome.js';

    export let tempo = 120;
    export let accent = 4;

    const metro = new Metronome();

    onDestroy(() => {
        // turn off metronome
        metro.stop();
    });
</script>

<button
    title="Toggle metronome (click)"
    on:click="{() => {
        metro.toggle(tempo, accent);
    }}"
>
    metronome
</button>
