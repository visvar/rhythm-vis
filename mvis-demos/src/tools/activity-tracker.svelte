<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { localStorageGetUsageData } from '../lib/localstorage';
    import { APP_MAP } from '../apps';
    import { onMount } from 'svelte';

    /**
     * TODO: show number of played notes
     */

    export let toolInfo;
    let width = 1000;
    let height = 500;
    let container1;
    let container2;
    const usage = localStorageGetUsageData();
    console.log(usage);

    let appUsage = [];
    for (const key in usage.demoClicks) {
        if (Object.hasOwnProperty.call(usage.demoClicks, key)) {
            if (key !== 'undefined') {
                const element = usage.demoClicks[key];
                appUsage.push({
                    id: key,
                    dates: element.map((d) => new Date(d)),
                    useCount: element.length,
                    // only use day
                    // dates: element.map((d) => new Date(d.slice(0, 10))),
                });
            }
        }
    }
    appUsage = appUsage.sort((a, b) => b.useCount - a.useCount);

    const dotData = appUsage.flatMap((app) =>
        app.dates.map((d) => {
            return { app: app.id, date: d };
        }),
    );

    /**
     * Draw visualization
     */
    const draw = () => {
        container1.textContent = '';
        // plot
        const plot1 = Plot.plot({
            width,
            height,
            marginLeft: 200,
            x: {
                label: 'times used',
            },
            y: {
                label: 'app',
                grid: true,
                domain: appUsage.map((d) => d.id),
                // interval: d3.timeDays,
            },
            marks: [
                Plot.waffleX(appUsage, {
                    x: 'useCount',
                    y: 'id',
                    tip: true,
                    rx: 4,
                }),
                Plot.text(appUsage, {
                    x: 'useCount',
                    y: 'id',
                    text: 'useCount',
                    textAnchor: 'start',
                    dx: 7,
                    paintOrder: 'stroke',
                    fill: '#333',
                    stroke: 'white',
                    strokeWidth: 10,
                }),
            ],
        });
        container1.appendChild(plot1);
        // plot
        container2.textContent = '';
        const plot2 = Plot.plot({
            width,
            height,
            marginLeft: 200,
            x: {
                label: 'time of usage',
            },
            y: {
                grid: true,
                domain: appUsage.map((d) => d.id),
                // interval: d3.timeDays,
            },
            marks: [
                Plot.dot(dotData, {
                    x: 'date',
                    y: 'app',
                    tip: true,
                }),
            ],
        });
        container2.appendChild(plot2);
    };

    onMount(draw);
</script>

<main class="demo">
    <h2>{toolInfo.title}</h2>
    <p class="explanation">
        Here, you can see how often and when you used each app. This data is
        only saved locally and can be reset in settings.
    </p>
    <div class="control"></div>
    <h3>Usage Count</h3>
    <div class="visualization" bind:this="{container1}"></div>
    <h3>Usage Dates</h3>
    <div class="visualization" bind:this="{container2}"></div>
</main>
