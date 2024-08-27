<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { localStorageGetUsageData } from '../lib/localstorage';
    import { APP_MAP } from '../apps';
    import { onMount } from 'svelte';
    import { star } from '../lib/icons';

    /**
     * TODO: show number of played notes
     */

    export let toolInfo;
    let width = 1000;
    let height = 500;
    let container;
    const usage = localStorageGetUsageData();

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
    // TODO: also show unused apps?
    appUsage = appUsage.sort((a, b) => b.useCount - a.useCount);

    const dotData = appUsage.flatMap((app) =>
        app.dates.map((d) => {
            return { app: app.id, date: d };
        }),
    );

    let appRatings = [];
    let appRatingsDetail = [];
    for (const key in usage.ratings) {
        if (Object.hasOwnProperty.call(usage.ratings, key)) {
            if (key !== 'undefined') {
                const element = usage.ratings[key];
                appRatings.push({
                    id: key,
                    meanRating: d3.mean(element, (d) => d.value),
                });
                appRatingsDetail.push({
                    id: key,
                    subRating: ' mean over all',
                    value: d3.mean(element, (d) => d.value),
                });
                for (const rating of element) {
                    appRatingsDetail.push({
                        id: key,
                        subRating: rating.id,
                        value: rating.value,
                    });
                }
            }
        }
    }
    // TODO: also show unrated apps?
    appRatings = appRatings.sort((a, b) => b.meanRating - a.meanRating);

    /**
     * Draw visualization
     */
    const draw = () => {
        container.textContent = '';
        // usage count plot
        const plot1 = Plot.plot({
            title: 'Usage Count',
            width,
            marginLeft: 200,
            x: {
                label: 'times used',
            },
            y: {
                label: 'app',
                grid: true,
                domain: appUsage.map((d) => d.id),
            },
            marks: [
                Plot.waffleX(appUsage, {
                    x: 'useCount',
                    y: 'id',
                    tip: true,
                    rx: 8,
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
        container.appendChild(plot1);
        // usage dates plot
        const plot2 = Plot.plot({
            title: 'Usage Dates',
            width,
            height,
            marginLeft: 200,
            x: {
                label: 'time of usage',
            },
            y: {
                grid: true,
                domain: appUsage.map((d) => d.id),
            },
            marks: [
                Plot.dot(dotData, {
                    x: 'date',
                    y: 'app',
                    tip: true,
                }),
            ],
        });
        container.appendChild(plot2);
        // app rating plot
        const plot3 = Plot.plot({
            title: 'App Ratings',
            width,
            marginLeft: 200,
            marginRight: 40,
            x: {
                label: 'mean of partial ratings',
            },
            y: {
                label: 'app',
                grid: true,
                domain: appRatings.map((d) => d.id),
            },
            marks: [
                Plot.waffleX(appRatings, {
                    x: 'meanRating',
                    y: 'id',
                    tip: true,
                    rx: 8,
                    fill: 'gold',
                }),
                Plot.text(appRatings, {
                    x: 'meanRating',
                    y: 'id',
                    text: (d) => `${d.meanRating.toFixed(1)} ${star}`,
                    textAnchor: 'start',
                    dx: 7,
                    paintOrder: 'stroke',
                    fill: '#333',
                    stroke: 'white',
                    strokeWidth: 10,
                }),
            ],
        });
        container.appendChild(plot3);
        // app sub-rating plot
        const plot4 = Plot.plot({
            title: 'App Sub-Ratings',
            width,
            marginLeft: 200,
            marginRight: 40,
            x: { axis: false },
            y: {
                label: 'app',
                domain: appRatings.map((d) => d.id),
            },
            facet: {
                data: appRatingsDetail,
                x: 'subRating',
                label: 'sub-rating',
            },
            marks: [
                Plot.waffleX(appRatingsDetail, {
                    x: 5,
                    y: 'id',
                    rx: 6,
                    // fill: '#eee',
                    stroke: '#eee',
                }),
                Plot.waffleX(appRatingsDetail, {
                    x: 'value',
                    y: 'id',
                    tip: true,
                    rx: 6,
                    fill: 'gold',
                }),
            ],
        });
        container.appendChild(plot4);
    };

    onMount(draw);
</script>

<main class="demo">
    <h2>{toolInfo.title}</h2>
    <p class="explanation">
        Here, you can see how often and when you used each app. This data is
        only saved locally and can be reset in settings.
    </p>
    <div class="visualization" bind:this="{container}"></div>
</main>
