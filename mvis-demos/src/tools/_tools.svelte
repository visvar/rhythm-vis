<script>
    import ChordDetection from './chord-detection.svelte';
    import GuitarTab from './guitar-tab.svelte';
    import GuitarTunings from './guitar-tunings.svelte';
    import MidiLogger from './midi-logger.svelte';
    import NoteColors from './note-colors.svelte';
    import PianoRoll from './piano-roll.svelte';
    import ScaleSets from './scale-sets.svelte';

    let TOOLS = [
        {
            id: 'midi-logger',
            title: 'MIDI Logger',
            description:
                'Logs all incoming MIDI messages. Useful for getting to know a device or debugging MIDI issues.',
            component: MidiLogger,
        },
        {
            id: 'piano-roll',
            title: 'Piano Roll',
            description: 'Shows MIDI input as a piano roll.',
            component: PianoRoll,
        },
        {
            id: 'guitar-tab',
            title: 'Guitar Tab',
            description: 'Shows MIDI input as guitar tab.',
            component: GuitarTab,
        },
        {
            id: 'guitar-tunings',
            title: 'Guitar Tunings',
            description:
                'Small tool that computes the notes for a guitar tuning based on parameters. Open tunings are not included.',
            component: GuitarTunings,
        },
        {
            id: 'chord-detection',
            title: 'Chord Detection',
            description: "Play a chord and see what it's named.",
            component: ChordDetection,
        },
        {
            id: 'note-colors',
            title: 'Note Colors',
            description: 'Different note coor schemes.',
            component: NoteColors,
        },
        {
            id: 'scale-sets',
            title: 'Scale Sets',
            description:
                'See how different musical scales relate to each other.',
            component: ScaleSets,
        },
    ];

    let currentTool;
</script>

<main>
    {#if !currentTool}
        <p class="explanation">
            This page contains a collection of simple but useful tools.
        </p>
        <div class="grid">
            {#each TOOLS as tool}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="card"
                    on:click="{() => {
                        currentTool = tool;
                    }}"
                >
                    <h2>{tool.title}</h2>
                    <div class="description">
                        {tool.description}
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div>
            <svelte:component this="{currentTool.component}" />
        </div>
    {/if}
</main>
