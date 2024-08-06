<script>
    import { onMount } from 'svelte';

    export let shown = false;

    let container;

    const setStyle = () => {
        container.style = shown ? 'display: inline-block' : 'display: none';
    };

    const toggle = () => {
        shown = !shown;
        setStyle();
    };

    onMount(setStyle);
</script>

<button on:click="{toggle}">{shown ? 'Hide' : 'Show'} exercise</button>
<div bind:this="{container}">
    <slot></slot>
</div>

<style>
    button {
        width: 150px;
    }

    div {
        display: inline-block;
        transition: all 500ms;
        border: 1px solid #eee;
    }
</style>
