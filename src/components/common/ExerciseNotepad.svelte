<script>
    import { readTextFile, writeTextFile } from '../../lib/files';

    export let dataDirectoryHandle;
    export let fileName;

    let content = '';
    let saved = true;

    $: {
        if (dataDirectoryHandle && fileName) {
            getContent();
        }
    }

    const getContent = async () => {
        console.log('loading text', fileName);
        try {
            const handle = await dataDirectoryHandle.getFileHandle(
                `${fileName}.notes.txt`
            );
            content = await readTextFile(handle);
        } catch (e) {
            console.log(e);
            // file does not exist
            content = '';
        }
    };

    const save = async () => {
        writeTextFile(dataDirectoryHandle, `${fileName}.notes.txt`, content);
        saved = true;
    };
</script>

<main>
    <label for="notepadtextarea">Notepad</label>
    <button on:click="{save}" disabled="{saved}">save</button>
    <div>
        <textarea
            id="notepadtextarea"
            bind:value="{content}"
            on:change="{() => {
                saved = false;
            }}"
            on:keypress="{() => {
                saved = false;
            }}"></textarea>
    </div>
</main>

<style>
    textarea {
        width: 600px;
        min-height: 50px;
        outline: none;
        border: 2px solid #ccc;
        border-radius: 3px;
    }
</style>
