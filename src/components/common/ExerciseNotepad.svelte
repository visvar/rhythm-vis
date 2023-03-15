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

    const onInput = (event) => {
        event.stopPropagation();
        saved = false;
    };
</script>

<main>
    <label for="notepadtextarea">Notepad</label>
    <button on:click="{() => save(fileName)}" disabled="{saved}">save</button>
    <div>
        <textarea
            id="notepadtextarea"
            bind:value="{content}"
            on:input="{onInput}"
            on:keypress="{onInput}"></textarea>
    </div>
</main>

<style>
    main {
        display: grid;
        grid-template-columns: min-content min-content auto;
        align-items: center;
        gap: 20px;
        width: 100%;
        max-width: 800px;
        margin: 10px auto;
    }
    textarea {
        width: 100%;
        min-height: 2.5rem;
        outline: none;
        border: 2px solid #ccc;
        border-radius: 3px;
        background-color: #fcfcfc;
    }
</style>
