<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';

    export let data;
    export let domain;
    export let title = '';
    export let width = 800;
    export let height = 300;

    let plotContainer;

    afterUpdate(() => {
        console.log(title);
        console.log(data);
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 70,
            marginRight: 10,
            x: {
                label: title,
                domain,
            },
            y: {
                axis: false,
                type: 'band',
                // domain: d3.range(0, data.lenght),
            },
            marks: [
                Plot.tickX(data, { x: (d) => d, strokeWidth: 0.5 }),
                Plot.text(data, {
                    x: (d) => d,
                    dx: 7,
                    y: (d, i) => i,
                    text: (d, i) => {
                        return `P${Math.floor(i / 3) + 1}-${(i % 3) + 1}`;
                    },
                    fill: 'black',
                    stroke: 'white',
                }),
                // Plot.frame()
            ],
        });

        plotContainer.textContent = '';
        plotContainer.appendChild(plot);
    });
</script>

<div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
