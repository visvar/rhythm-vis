<script>
    import GuitarTab from './guitar-tab.svelte';
    import GuitarTunings from './guitar-tunings.svelte';
    import PianoRoll from './piano-roll.svelte';

    let TOOLS = [
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
                    {tool.description}
                </div>
            {/each}
        </div>
    {:else}
        <div>
            <svelte:component this="{currentTool.component}" />
        </div>
    {/if}
</main>
