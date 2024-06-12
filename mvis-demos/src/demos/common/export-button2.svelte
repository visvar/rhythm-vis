<script>
    import { downloadJsonFile } from '../../lib/json';

    export let demoId;
    export let getExportData;

    const exportData = () => {
        const data = getExportData();
        downloadJsonFile(demoId, data);
    };
</script>

<button title="Export all data and settings" on:click="{exportData}">
    export
</button>
