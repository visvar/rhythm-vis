<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';

    export let stimuli;
    export let width = 800;
    export let height = 200;

    let plotContainer;

    afterUpdate(() => {
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 100,
            marginRight: 10,
            x: {
                label: 'absolute deviation in percent of the IOI',
            },
            y: {
                label: '',
                type: 'band',
                domain: cis
                    .sort((a, b) => a.mean - b.mean)
                    .map((d) => d.encoding),
            },
            marks: [
                Plot.dot(cis, {
                    x: (d) => d.mean,
                    y: (d) => d.encoding,
                    symbol: 'diamond',
                }),
                Plot.link(cis, {
                    x1: 'low',
                    y1: 'encoding',
                    x2: 'high',
                    y2: 'encoding',
                }),
                Plot.ruleX([0]),
            ],
        });

        plotContainer.textContent = '';
        plotContainer.appendChild(plot);
    });
</script>

<div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
