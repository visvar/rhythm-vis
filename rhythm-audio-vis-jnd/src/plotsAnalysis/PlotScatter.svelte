<script>
  import * as Plot from '@observablehq/plot';
  import { afterUpdate } from 'svelte';

    export let title = '';
    export let data;
    export let x = 'x';
    export let y = 'y';
    export let tipTitle = null;
    export let xLabel = null;
    export let yLabel = null;
    export let xDomain = undefined;
    export let yDomain = undefined;
    export let grid = false;
    export let width = 300;
    export let height = 300;

  let plotContainer;

    afterUpdate(() => {
        console.log(data, x, y);
        plotContainer.textContent = '';
        const plot = Plot.plot({
            width,
            height,
            title,
            grid,
            style: {
                background: 'none',
            },
            // grid,
            x: {
                label: xLabel ? xLabel : typeof x === 'string' ? x : 'x',
                domain: xDomain,
            },
            y: {
                label: yLabel ? yLabel : typeof y === 'string' ? y : 'y',
                domain: yDomain,
            },
            marks: [
                Plot.dot(data, {
                    x,
                    y,
                    // fill: '#ccc',
                }),
                Plot.tip(
                    data,
                    Plot.pointer({
                        x,
                        y,
                        title: tipTitle,
                    }),
                ),
                Plot.link(
                    { length: 1 },
                    {
                        x1: xDomain[0],
                        x2: xDomain[1],
                        y1: yDomain[0],
                        y2: yDomain[1],
                        stroke: '#ccc',
                    },
                ),
                // Plot.linearRegressionX(data, {
                //     x,
                //     y,
                // }),
            ],
        });
        plotContainer.appendChild(plot);
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
