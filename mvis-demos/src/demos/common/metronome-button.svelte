<script>
    import { onDestroy } from 'svelte';
    import Metronome from '../../lib/Metronome.js';
    import PcKeyboardInput from './pc-keyboard-input.svelte';
    import { metronomeIcon } from '../../lib/icons.js';

    export let tempo = 120;
    export let accent = 4;
    export let beepCount = Infinity;
    export let showBeepCountInput = false;

    const metro = new Metronome();
    let button;

    const toggle = () => {
        metro.toggle(tempo, accent, beepCount > 0 ? beepCount : Infinity);
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
    style="{showBeepCountInput ? 'border-radius: 8px 0 0 8px;' : ''}"
>
    {metronomeIcon} metronome
</button>
{#if showBeepCountInput}
    <input
        type="number"
        step="1"
        min="0"
        bind:value="{beepCount}"
        title="The number of beeps for count-in, set to 0 for infinite beeps"
    />
{/if}
<PcKeyboardInput key="m" keyDown="{toggle}" />

<style>
    button {
        transition: all 250ms;
    }
    input {
        width: 30px;
        margin-left: -10px;
        border-radius: 0 8px 8px 0;
    }
</style>
