<script>
    import * as Plot from '@observablehq/plot';
    import * as kde from 'fast-kde';
    import { afterUpdate } from 'svelte';

    export let values;
    export let title = '';
    export let xLabel = 'some value';
    export let xDomain = undefined;
    export let width = 1000;
    export let height = 100;

    // these control the shape and padding of the curve
    export let bandwidth = 0.25;
    export let bins = 256;
    export let pad = 4;

    let plotContainer;

    $: density1d = kde.density1d(values, { bandwidth, pad, bins });

    afterUpdate(() => {
        const kdePoints = [...density1d.bandwidth(bandwidth)];
        plotContainer.textContent = '';
        const plot = Plot.plot({
            width,
            height,
            title,
            style: {
                background: 'none',
            },
            grid: true,
            x: { label: xLabel, domain: xDomain },
            y: { label: 'density', type: 'linear' },
            marks: [
                // use bandwidth method to update efficiently without re-binning
                Plot.areaY(kdePoints, {
                    x: 'x',
                    y: 'y',
                    fill: '#ccc',
                }),
                Plot.tickX(values, {
                    x: (d) => d,
                    // y: 0,
                    strokeWidth: 0.5,
                }),
                // Plot.ruleX([0]),
                Plot.ruleY([0]),
            ],
        });
        plotContainer.appendChild(plot);
    });
</script>

<main>
    <div
        bind:this="{plotContainer}"
        width="{width}px"
        height="{height}px"
    ></div>
</main>
