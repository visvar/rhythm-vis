<script>
    import { caretDownIcon, caretUpIcon } from './lib/icons';

    let skillTree = [
        {
            title: 'timing',
            children: [
                {
                    title: 'playing to grid',
                    skill: 'sub-division',
                },
                {
                    title: 'tempo keeping',
                    skill: 'tempo-keeping',
                },
                {
                    title: 'chord timing',
                    skill: 'chord-timing',
                },
                {
                    title: 'arpeggio timing',
                    skill: 'argpeggio-timing',
                },
                {
                    title: 'timing consistency',
                    skill: 'timing-consistency',
                },
            ],
        },
        {
            title: 'dynamics',
            children: [
                {
                    title: 'constant dynamics',
                    skill: 'constant-dynamics',
                },
                {
                    title: '(de)crescendo',
                    skill: '(de)crescendo',
                },
            ],
        },
        {
            title: 'pitch',
            children: [
                {
                    title: 'intervals',
                    skill: 'pitch-intervals',
                },
                {
                    title: 'scale degrees',
                    skill: 'scale-degrees',
                },
                {
                    title: 'chord notes',
                    skill: 'chord-notes',
                },
                {
                    title: 'pitch keeping',
                    skill: 'pitch-keeping',
                },
                {
                    title: 'bending',
                    skill: 'bending',
                },
                {
                    title: 'vibrato',
                    skill: 'vibrato',
                },
            ],
        },
        {
            title: 'instrument',
            children: [
                {
                    title: 'instrument layout',
                    skill: 'instrument-layout',
                },
            ],
        },
    ];

    export let allSkills = new Set();
    export let currentSkills = new Set();

    const toggleNode = (node) => {
        const shown = !node.shown;
        if (shown) {
            // hide others when this is shown
            skillTree.flat(Infinity).forEach((d) => (d.shown = false));
        }
        node.shown = shown;
        // trigger re-render
        skillTree = [...skillTree];
    };
</script>

<main>
    <h2>skills</h2>
    <button on:click="{() => (currentSkills = allSkills)}"> show all </button>
    {#each skillTree as node}
        <button class="node" on:click="{() => toggleNode(node)}">
            {node.shown ? caretUpIcon : caretDownIcon}
            {node.title}
        </button>
        {#if node.shown}
            {#each node.children as skill}
                <button
                    class="skill"
                    on:click="{() => (currentSkills = new Set([skill.skill]))}"
                >
                    {skill.title}
                </button>
            {/each}
        {/if}
    {/each}
</main>

<style>
    main {
        text-align: left;
    }

    .skill {
        margin: 0 0 0 20px;
        border: none;
        border-left: 1px solid #888;
        border-radius: 0;
    }

    button.skill {
        font-weight: normal;
    }

    button.node,
    button.skill {
        display: block;
        background: none;
    }
</style>
