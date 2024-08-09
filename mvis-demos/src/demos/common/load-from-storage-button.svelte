<script>
    /**
     * A dropdown that allows loading an auto-saved recording.
     *
     * TODO: add a delete button for the currently selected recording, requires implementing localStorageDeleteRecording()
     */
    import { localSorageGetRecordings } from '../../lib/localstorage';

    export let demoId;
    export let loadData = (e) => {};

    let recordings = [];

    const loadRecordings = () => {
        recordings = localSorageGetRecordings(demoId).reverse();
    };
</script>

<select
    on:mousedown="{loadRecordings}"
    on:change="{(e) => loadData(recordings[+e.target.value].data)}"
>
    <option selected disabled>history</option>
    {#each recordings as r, i}
        <option value="{i}">{r.date.substring(0, 16)}</option>
    {/each}
</select>
