<script>
    import { localSorageGetRecordings } from '../../lib/localstorage';

    export let demoId;
    export let loadData = (e) => {};

    const recordings = localSorageGetRecordings(demoId).reverse();
</script>

<select on:change="{(e) => loadData(recordings[+e.target.value].data)}">
    <option selected disabled>history</option>
    {#each recordings as r, i}
        <option value="{i}">{r.date.substring(0, 16)}</option>
    {/each}
</select>
