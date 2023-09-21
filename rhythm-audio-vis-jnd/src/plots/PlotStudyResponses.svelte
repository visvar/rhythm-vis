<script>
    import * as Plot from '@observablehq/plot';
    import { afterUpdate } from 'svelte';

    export let tracking;
    export let width = 800;
    export let height = 200;

    let plotContainer;

    afterUpdate(() => {
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 50,
            x: {
                label: 'response index',
            },
            y: { label: 'stimulus value' },
            marks: [
                Plot.dot(tracking, {
                    x: (d, i) => i,
                    y: (d) => d.deviationSeconds,
                    stroke: null,
                    fill: 'black',
                }),
                Plot.lineY(tracking, {
                    x: (d, i) => i,
                    y: (d) => d.deviationSeconds,
                }),
                Plot.text(tracking, {
                    x: (d, i) => i,
                    y: (d) => d.deviationSeconds,
                    text: (d) => (d.correct ? 'R' : 'W'),
                    dy: 10,
                }),
                Plot.text(tracking, {
                    x: (d, i) => i,
                    y: (d) => d.deviationSeconds,
                    text: (d) => d.currentStep,
                    dy: 10,
                    dx: 10,
                }),
                Plot.ruleX([0]),
                Plot.ruleY([0]),
            ],
        });

        plotContainer.textContent = '';
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
