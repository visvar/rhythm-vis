<script>
    export let importFunction;

    let fileInput;
</script>

<button
    title="Import all data and settings"
    on:click="{() => fileInput.click()}"
>
    import
</button>
<input
    bind:this="{fileInput}"
    type="file"
    on:input="{importFunction}"
    id="file-input"
    style="display: none"
/>
