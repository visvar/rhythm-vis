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
                ...confidenceInterval(d.trialCounts),
            };
        });
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 100,
            marginRight: 10,
            x: {
                label: 'trial count',
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
