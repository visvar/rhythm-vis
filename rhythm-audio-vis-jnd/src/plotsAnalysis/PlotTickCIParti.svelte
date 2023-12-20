<script>
    import * as Plot from '@observablehq/plot';
    import * as d3 from 'd3';
    import { afterUpdate } from 'svelte';

    export let partis;
    export let width = 800;
    export let height = 150;

    let plotContainer;

    afterUpdate(() => {
        const cis = partis.map((d) => {
            return {
                partID: d.partID,
                ...confidenceInterval(d.finals),
            };
        });
        console.log(partis, cis);
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
                    .map((d) => d.partID),
            },
            marks: [
                Plot.dot(cis, {
                    x: (d) => d.mean,
                    y: (d) => d.partID,
                    symbol: 'diamond',
                }),
                Plot.dot(partis, {
                    x: (d) => d.mean,
                    y: (d) => d.partID,
                    // symbol: 'diamond',
                }),
                Plot.link(cis, {
                    x1: 'low',
                    y1: 'partID',
                    x2: 'high',
                    y2: 'partID',
                }),
                Plot.ruleX([0]),
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
