<script>
    import { onDestroy, onMount } from 'svelte';
    /**
     * This component allows to copy a link to the clipboard that contains the current settings of the app. It also detects whether such a link has been opened and loads the settings
     */
    import { replacer } from '../../lib/json';
    import { getUrlParam, setUrlParam } from '../../lib/url';

    export let getExportData;
    export let loadData;

    let button;

    const exportData = () => {
        const data = getExportData();
        const json = JSON.stringify(data, replacer, 0);
        const encoded = encodeURI(json);
        const link = `${location.href.replace('&json=', '')}&json=${encoded}`;
        navigator.clipboard.writeText(link);
        // visual feedback
        button.style = 'background: lightblue';
        button.innerText = 'copied';
        setTimeout(() => {
            button.style = '';
            button.innerText = 'share';
        }, 500);
    };

    // when mounted, check if URL contains settings and load them
    onMount(() => {
        const param = getUrlParam(window, 'json');
        console.log({ param });

        if (param !== '') {
            const decoded = decodeURI(param);
            const json = JSON.parse(decoded);
            console.log(json);

            loadData(json);
        }
    });

    // when destroyed, clear the current URL, so other apps do not get this data
    onDestroy(() => {
        setUrlParam(window, 'json', '');
    });
</script>

<button
    title="Get a link that contains the current configuration"
    on:click="{exportData}"
    bind:this="{button}"
>
    share
</button>

<style>
    button {
        width: 75px;
    }
</style>
