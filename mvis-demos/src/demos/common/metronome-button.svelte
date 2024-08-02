<script>
    import { onDestroy } from 'svelte';
    import Metronome from '../../lib/Metronome.js';
    import PcKeyboardInput from './pc-keyboard-input.svelte';

    export let tempo = 120;
    export let accent = 4;
    export let maxBeeps = Infinity;

    const metro = new Metronome();
    let button;

    const toggle = () => {
        metro.toggle(tempo, accent, maxBeeps);
        // animate button to show toggle
        button.style = 'background: lightblue';
        setTimeout(() => (button.style = ''), 500);
    };

    onDestroy(() => {
        // turn off metronome
        metro.stop();
    });
</script>

<button
    bind:this="{button}"
    title="Toggle metronome (shortcut: m)"
    on:click="{toggle}"
>
    metronome
</button>
<PcKeyboardInput key="m" keyDown="{toggle}" />

<style>
    button {
        transition: all 250ms;
    }
</style>
