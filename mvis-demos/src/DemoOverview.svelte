<script>
    import { SKILL_TREE } from './lib/skills';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { onMount } from 'svelte';

    export let demos = [];
    export let allInstruments = new Set();

    let container;

    const drawTree = () => {
        const getPaths = (tree) => {
            if (tree.children) {
                const childPaths = tree.children.flatMap((child) =>
                    getPaths(child).map((d) => `${tree.title}/${d}`),
                );

                return [tree.title, ...childPaths];
            } else {
                return [tree.title];
            }
        };
        const treePaths = getPaths({ title: 'skills', children: SKILL_TREE });
        const plot = Plot.plot({
            axis: null,
            margin: 10,
            marginLeft: 60,
            marginRight: 160,
            width: 800,
            marks: [
                Plot.cluster(treePaths, {
                    treeSort: 'node:height',
                    // delimiter: '/',
                    fontSize: 16,
                }),
            ],
        });
        container.textContent = '';
        container.appendChild(plot);
    };

    onMount(drawTree);
</script>

<main>
    <h2>input and instrument</h2>
    <table>
        <thead>
            <th>title</th>
            <th colspan="2" class="blue">input</th>
            <th colspan="{allInstruments.size}" class="green">instrument</th>
        </thead>
        <thead>
            <th></th>
            <!-- input -->
            <th class="small">MIDI</th>
            <th class="small">audio</th>
            <!-- instrument -->
            {#each [...allInstruments] as i}
                <th class="small">{i}</th>
            {/each}
        </thead>
        <thead>
            <th></th>
            <!-- input -->
            <th colspan="2"></th>
            <!-- instrument -->
            <th colspan="{allInstruments.size}"></th>
        </thead>
        <tbody>
            {#each demos as d}
                <tr>
                    <td style="text-align: right;">{d.title}</td>
                    <!-- input -->
                    <td>{d.input === 'MIDI' ? '⬤' : ''}</td>
                    <td>{d.input === 'audio' ? '⬤' : ''}</td>
                    <!-- instrument -->
                    {#each [...allInstruments] as i}
                        <td>{d.instruments.includes(i) ? '⬤' : ''}</td>
                    {/each}
                </tr>
            {/each}
            <!-- counts -->
            <tr>
                <td>{demos.length}</td>
                <!-- input -->
                <td>{demos.filter((d) => d.input === 'MIDI').length}</td>
                <td>{demos.filter((d) => d.input === 'audio').length}</td>
                <!-- instrument -->
                {#each [...allInstruments] as i}
                    <td
                        >{demos.filter((d) => d.instruments.includes(i))
                            .length}</td
                    >
                {/each}
            </tr>
        </tbody>
    </table>

    <h2>skills</h2>
    <table>
        <thead>
            <th style="min-width: 270px">title</th>
            <!-- skill -->
            {#each SKILL_TREE as s, index}
                <th
                    colspan="{s.children.length}"
                    style="border-bottom: 4px solid {d3.schemeObservable10[
                        index
                    ]}"
                >
                    {s.title}
                </th>
            {/each}
        </thead>
        <thead>
            <th></th>
            <!-- skill -->
            {#each SKILL_TREE as s}
                {#each s.children as skill}
                    <th class="small">{skill.title}</th>
                {/each}
            {/each}
        </thead>
        <tbody>
            {#each demos as d}
                <tr>
                    <td style="text-align: right;">{d.title}</td>
                    <!-- skill -->
                    {#each SKILL_TREE as s}
                        {#each s.children as skill}
                            <td>{d.skills.includes(skill.id) ? '⬤' : ''}</td>
                        {/each}
                    {/each}
                </tr>
            {/each}
            <!-- counts -->
            <tr>
                <td>{demos.length}</td>
                {#each SKILL_TREE as s}
                    {#each s.children as skill}
                        <td>
                            {demos.filter((d) => d.skills.includes(skill.id))
                                .length}
                        </td>
                    {/each}
                {/each}
            </tr>
        </tbody>
    </table>

    <!-- skill tree -->
    <h2>skill tree</h2>
    <div class="visualization" bind:this="{container}"></div>
</main>

<style>
    td {
        min-width: 60px;
    }

    table tr:nth-child(odd) {
        background-color: #f8f8f8;
    }

    .blue {
        border-bottom: 4px solid lightblue;
    }
    .green {
        border-bottom: 4px solid lightgreen;
    }

    .small {
        font-size: smaller;
    }
</style>