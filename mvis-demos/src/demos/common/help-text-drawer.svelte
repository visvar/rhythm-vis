<script>
    export let heading = '';

    let shown = false;
</script>

<main>
    <h3 on:click="{() => (shown = !shown)}">
        {heading}
    </h3>
    {#if shown}
        <slot></slot>
    {/if}
</main>

<style>
    h3 {
        cursor: pointer;
    }
</style>
