<script>
    import { readTextFile, writeTextFile } from '../../lib/files';

    export let dataDirectoryHandle;
    export let fileName;

    let content = '';
    let saved = true;
    let lastFileName;

    $: {
        if (dataDirectoryHandle && fileName) {
            getContent();
        }
    }

    const getContent = async () => {
        if (!saved) {
            if (confirm('Do you want to save your note first?')) {
                save(lastFileName);
            }
        }
        lastFileName = fileName;
        saved = true;
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

    const save = async (fileName) => {
        writeTextFile(dataDirectoryHandle, `${fileName}.notes.txt`, content);
        saved = true;
    };
</script>

<main>
    <label for="notepadtextarea">Notepad</label>
    <button on:click="{() => save(fileName)}" disabled="{saved}">save</button>
    <div>
        <textarea
            id="notepadtextarea"
            bind:value="{content}"
            on:input="{() => {
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
