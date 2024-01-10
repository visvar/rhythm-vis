<script>
    import * as Plot from '@observablehq/plot';
    import { afterUpdate } from 'svelte';

    export let width = 600;
    export let height = 200;
    export let options;

    let plotContainer;

    afterUpdate(() => {
        plotContainer.textContent = '';
        const plot = Plot.plot(options);
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
