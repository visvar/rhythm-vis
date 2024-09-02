<script>
    import { SKILL_TREE } from './lib/skills';
    import * as d3 from 'd3';
    import * as Plot from '@observablehq/plot';
    import { onMount } from 'svelte';
    import { APPS } from './apps';

    export let apps = [];
    export let allInstruments = new Set();
    export let allData = new Set();
    export let allPatterns = new Set();

    let skillTreeContainer;
    let matrixContainer;
    let matrixRow = 'skills';
    let matrixColumn = 'patterns';

    /**
     * draws the tree of skills
     */
    const drawSkillTree = () => {
        const getPaths = (tree) => {
            if (tree.children) {
                const childPaths = tree.children.flatMap((child) =>
                    getPaths(child).map((d) => `${tree.title}/${d}`),
                );

                return [tree.title, ...childPaths];
            } else {
                return [`${tree.label} ${tree.title}`];
            }
        };
        const treePaths = getPaths({
            title: 'skills',
            children: SKILL_TREE,
        });
        const plot = Plot.plot({
            axis: null,
            margin: 10,
            marginLeft: 60,
            marginRight: 300,
            width: 600,
            height: 600,
            marks: [
                Plot.cluster(treePaths, {
                    treeSort: 'node:height',
                    // delimiter: '/',
                    fontSize: 16,
                    // textLayout: 'normal',
                    stroke: '#ddd',
                    dot: false,
                }),
            ],
        });
        skillTreeContainer.textContent = '';
        skillTreeContainer.appendChild(plot);
    };

    /**
     * draws the tree of skills
     */
    const drawSkillPatternMatrix = () => {
        const data = new Map();
        for (const app of apps) {
            // add a datum for each combination of skill and pattern
            for (const attrib1 of app[matrixColumn]) {
                if (!data.has(attrib1)) {
                    data.set(attrib1, new Map());
                }
                const s = data.get(attrib1);
                for (const attrib2 of app[matrixRow]) {
                    if (!s.has(attrib2)) {
                        s.set(attrib2, new Set());
                    }
                    const p = s.get(attrib2);
                    p.add(app.title);
                }
            }
        }
        const data2 = [];
        for (const [k1, v1] of data.entries()) {
            for (const [k2, v2] of v1.entries()) {
                data2.push({
                    k1,
                    k2,
                    apps: [...v2],
                });
            }
        }
        const plot = Plot.plot({
            margin: 10,
            marginLeft: 150,
            marginRight: 50,
            marginBottom: 100,
            width: 1000,
            aspectRatio: 1.2,
            grid: true,
            x: {
                label: matrixColumn,
                tickRotate: 45,
                // domain:
                //     matrixColumn === 'skills'
                //         ? SKILL_TREE_LEAFS.map((d) => d.id)
                //         : undefined,
            },
            y: {
                label: matrixRow,
            },
            color: {
                label: 'number of apps',
                legend: true,
                scheme: 'blues',
                // scheme: 'cividis',
                // reverse: true,
            },
            marks: [
                Plot.cell(data2, {
                    x: (d) => d.k1,
                    y: (d) => d.k2,
                    fill: (d) => d.apps.length,
                    title: (d) => `${d.k1} | ${d.k2}\n\n${d.apps.join('\n')}`,
                    rx: 5,
                }),
                Plot.text(data2, {
                    x: (d) => d.k1,
                    y: (d) => d.k2,
                    text: (d) => d.apps.length,
                    stroke: '#fffc',
                    strokeWidth: 2.5,
                    fill: 'black',
                }),
            ],
        });
        matrixContainer.textContent = '';
        matrixContainer.appendChild(plot);
    };

    onMount(() => {
        drawSkillTree();
        drawSkillPatternMatrix();
    });
</script>

<main>
    <h2>input and instrument</h2>
    <table>
        <thead>
            <th style="min-width: 270px">app</th>
            <th
                colspan="2"
                style="border-bottom: 4px solid {d3.schemeObservable10[0]};"
            >
                input
            </th>
            <th class="spacer"></th>
            <th
                colspan="{allInstruments.size}"
                style="border-bottom: 4px solid {d3.schemeObservable10[1]};"
            >
                instrument
            </th>
            <th class="spacer"></th>
            <th
                colspan="{allData.size}"
                style="border-bottom: 4px solid {d3.schemeObservable10[2]};"
            >
                data
            </th>
        </thead>
        <thead>
            <th></th>
            <!-- input -->
            <th class="small">MIDI</th>
            <th class="small">audio</th>
            <!-- instrument -->
            <th class="spacer"></th>
            {#each [...allInstruments] as i}
                <th class="small">{i}</th>
            {/each}
            <!-- data -->
            <th class="spacer"></th>
            {#each [...allData] as d}
                <th class="small">{d}</th>
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
            {#each apps as d}
                <tr>
                    <td style="text-align: right;">{d.title}</td>
                    <!-- input -->
                    <td>{d.input === 'MIDI' ? '⬤' : ''}</td>
                    <td>{d.input === 'audio' ? '⬤' : ''}</td>
                    <!-- instrument -->
                    <td class="spacer"></td>
                    {#each [...allInstruments] as i}
                        <td>{d.instruments.includes(i) ? '⬤' : ''}</td>
                    {/each}
                    <!-- data -->
                    <td class="spacer"></td>
                    {#each [...allData] as i}
                        <td>{d.data.includes(i) ? '⬤' : ''}</td>
                    {/each}
                </tr>
            {/each}
            <!-- counts -->
            <tr>
                <td>{apps.length}</td>
                <!-- input -->
                <td>{apps.filter((d) => d.input === 'MIDI').length}</td>
                <td>{apps.filter((d) => d.input === 'audio').length}</td>
                <!-- instrument -->
                <td class="spacer"></td>
                {#each [...allInstruments] as i}
                    <td
                        >{apps.filter((d) => d.instruments.includes(i))
                            .length}</td
                    >
                {/each}
                <td class="spacer"></td>
                <!-- data -->
                {#each [...allData] as i}
                    <td>{apps.filter((d) => d.data.includes(i)).length}</td>
                {/each}
            </tr>
        </tbody>
    </table>

    <h2>skills</h2>
    <table>
        <thead>
            <th style="min-width: 270px">app</th>
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
                <th class="spacer"></th>
            {/each}
        </thead>
        <thead>
            <th></th>
            <!-- skill -->
            {#each SKILL_TREE as s}
                {#each s.children as skill}
                    <th class="small">{skill.title}</th>
                {/each}
                <th class="spacer"></th>
            {/each}
        </thead>
        <tbody>
            {#each apps as d}
                <tr>
                    <td style="text-align: right;">{d.title}</td>
                    <!-- skill -->
                    {#each SKILL_TREE as s}
                        {#each s.children as skill}
                            <td>{d.skills.includes(skill.id) ? '⬤' : ''}</td>
                        {/each}
                        <th class="spacer"></th>
                    {/each}
                    <!-- count of skills for this app -->
                    <td>{d.skills.length}</td>
                </tr>
            {/each}
            <!-- counts -->
            <tr>
                <td>{apps.length}</td>
                {#each SKILL_TREE as s}
                    {#each s.children as skill}
                        <td>
                            {apps.filter((d) => d.skills.includes(skill.id))
                                .length}
                        </td>
                    {/each}
                    <td class="spacer"></td>
                {/each}
                <td></td>
            </tr>
        </tbody>
    </table>

    <h2>patterns</h2>
    <table>
        <thead>
            <th style="min-width: 270px">app</th>
            <!-- patterns -->
            {#each [...allPatterns] as d}
                <th class="small">{d}</th>
            {/each}
        </thead>
        <tbody>
            {#each apps as d}
                <tr>
                    <td style="text-align: right;">{d.title}</td>
                    <!-- skill -->
                    {#each [...allPatterns] as i}
                        <td>{d.patterns.includes(i) ? '⬤' : ''}</td>
                    {/each}
                    <td>{d.patterns.length}</td>
                </tr>
            {/each}
            <!-- counts -->
            <tr>
                <td>{apps.length}</td>
                {#each [...allPatterns] as i}
                    <td>{apps.filter((d) => d.patterns.includes(i)).length}</td>
                {/each}
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- skill tree -->
    <h2>skill tree</h2>
    <div class="visualization" bind:this="{skillTreeContainer}"></div>

    <!-- list by skill -->
    <h2>apps listed by skill</h2>
    <ul class="list">
        {#each SKILL_TREE as s}
            <li>
                <b>{s.title}</b>
                <ul>
                    {#each s.children as skill}
                        <li>
                            <b>{skill.title}</b>
                            <ul>
                                {#each APPS.filter( (d) => d.skills.includes(skill.id), ) as app}
                                    <li style="font-size: 12px;">
                                        {app.title}
                                    </li>
                                {/each}
                            </ul>
                        </li>
                    {/each}
                </ul>
            </li>
        {/each}
    </ul>

    <!-- matrix -->
    <h2>app metadata co-occurrence</h2>
    <label>
        row
        <select bind:value="{matrixRow}" on:change="{drawSkillPatternMatrix}">
            {#each ['skills', 'patterns', 'data', 'instruments'] as d}
                <option value="{d}">{d}</option>
            {/each}
        </select>
    </label>
    <label>
        column
        <select
            bind:value="{matrixColumn}"
            on:change="{drawSkillPatternMatrix}"
        >
            {#each ['skills', 'patterns', 'data', 'instruments'] as d}
                <option value="{d}">{d}</option>
            {/each}
        </select>
    </label>
    <div class="visualization" bind:this="{matrixContainer}"></div>

    <div>
        <h3>App List</h3>
        <ul class="list">
            {#each apps as d}
                <li>{d.title}</li>
            {/each}
        </ul>
    </div>
</main>

<style>
    td:not(.spacer) {
        min-width: 60px;
    }

    table th.spacer,
    table td.spacer {
        min-width: 20px;
        background-color: white;
    }

    table tr:nth-child(odd) {
        background-color: #f8f8f8;
    }

    .small {
        font-size: smaller;
    }

    ul.list {
        margin: auto;
        width: max-content;
        text-align: left;
    }
</style>
