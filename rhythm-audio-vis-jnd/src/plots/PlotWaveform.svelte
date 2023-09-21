<script>
    import * as Plot from '@observablehq/plot';
    import { afterUpdate } from 'svelte';

    export let audioData;
    export let sampleRate;
    export let width = 800;
    export let height = 50;

    let plotContainer;

    afterUpdate(() => {
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 50,
            x: {
                axis: false,
                label: 'time in seconds',
            },
            y: { axis: false },
            marks: [
                Plot.lineY(audioData, {
                    x: (d, i) => i / sampleRate,
                    y: (d) => d,
                }),
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
