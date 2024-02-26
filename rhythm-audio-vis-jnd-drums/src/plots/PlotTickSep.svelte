<script>
    import * as Plot from '@observablehq/plot';
    import { afterUpdate } from 'svelte';

    export let pattern;
    export let width = 800;
    export let height = 100;

    let plotContainer;

    afterUpdate(() => {
        const plot = Plot.plot({
            width,
            height,
            marginLeft: 1,
            marginRight: 1,
            x: {
                axis: false,
                // domain: [0, Math.max(...pattern) + 1],
            },
            y: {
                axis: false,
                domain: ['hihat', 'snare', 'bass'],
            },
            marks: [
                Plot.tickX(pattern, { x: 'time', y: 'instr' }),
                // Plot.frame()
            ],
        });

        plotContainer.textContent = '';
        plotContainer.appendChild(plot);
    });
</script>

<main style="width: {width}px; margin: auto">
    <div
        bind:this="{plotContainer}"
        width="{width}px"
        height="{height}px"
    ></div>
    <!-- <div>
        Each note is represented by a tick placed at its onset time from left to
        right. A smaller gap indicates an early note.
    </div> -->
</main>
