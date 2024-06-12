<script>
    import { parseJsonFile } from '../../lib/json';

    export let loadData;

    let fileInput;

    /**
     * import previously exported JSON file
     * @param {InputEvent} e file input event
     */
    const importData = async (e) => {
        const json = await parseJsonFile(e);
        loadData(json);
    };
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
    on:input="{importData}"
    id="file-input"
    style="display: none"
/>
