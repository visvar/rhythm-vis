<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';

    export let stimuli;
    export let width = 800;
    export let height = 200;

    let plotContainer;

    afterUpdate(() => {
        const cis = stimuli.map((d) => {
            return {
                encoding: d.encoding,
                ...confidenceInterval(d.finals),
            };
        });
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 100,
            marginRight: 10,
            x: {
                // domain,
            },
            y: {
                // axis: false,
                label: '',
                type: 'band',
                // domain: d3.range(0, data.lenght),
            },
            marks: [
                Plot.tickX(cis, {
                    x: (d) => d.mean,
                    y: (d) => d.encoding,
                }),
                Plot.link(cis, {
                    x1: 'low',
                    y1: 'encoding',
                    x2: 'high',
                    y2: 'encoding',
                    // markerEnd: 'arrow',
                }),
                Plot.ruleX([0]),
                // Plot.text(data, {
                //     x: (d) => d,
                //     dx: 7,
                //     y: (d, i) => i,
                //     text: (d, i) => {
                //         return `P${i + 1}`;
                //     },
                // }),
                // Plot.frame()
            ],
        });

        plotContainer.textContent = '';
        plotContainer.appendChild(plot);
    });

    /**
     * Calculates a 95% confidence interval
     *
     * @see https://www.alchemer.com/resources/blog/how-to-calculate-confidence-intervals/
     * @param {number[]} values values
     * @returns {object} {mean, low, high}
     */
    export function confidenceInterval(values) {
        const n = values.length;
        const m = d3.mean(values);
        const s = d3.deviation(values);
        const z = 1.96; // 95% CI
        // const z = 2.576; // 99% CI
        const part = z * (s / Math.sqrt(n));
        const low = m - part;
        const high = m + part;
        return { mean: m, low, high };
    }
</script>

<div bind:this="{plotContainer}" width="{width}px" height="{height}px"></div>
