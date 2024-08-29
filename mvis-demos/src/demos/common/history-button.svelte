<script>
    /**
     * A dropdown that allows loading an auto-saved recording.
     *
     * TODO: add a delete button for the currently selected recording, requires implementing localStorageDeleteRecording()
     */
    import {
        localSorageGetRecordings,
        localStorageDeleteRecording,
    } from '../../lib/localstorage';
    import PcKeyboardInput from './pc-keyboard-input.svelte';

    export let demoId;
    export let loadData = (e) => {};

    let recordings = [];
    let modalShown = false;

    const loadRecordings = () => {
        recordings = localSorageGetRecordings(demoId).reverse();
    };

    const toggleModal = (e) => {
        // e.preventDefault();
        modalShown = !modalShown;
    };
</script>

<button
    title="Load a previously auto-saved take"
    on:click="{() => {
        loadRecordings();
        toggleModal();
    }}"
>
    history
</button>
{#if modalShown}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal">
        <div class="modal-content">
            <div class="heading">
                <h2>Load from History</h2>
                <button
                    title="close (escape)"
                    class="close"
                    on:click="{toggleModal}"
                >
                    &times;
                </button>
            </div>
            {#each recordings as r, i}
                <div class="recording">
                    <div>
                        {r.date.substring(0, 16).replace('T', ' ')}
                    </div>
                    <button on:click="{(e) => loadData(r.data)}"> load </button>
                    <button
                        on:click="{(e) => {
                            if (confirm('delete?')) {
                                localStorageDeleteRecording(demoId, r.date);
                                loadRecordings();
                            }
                        }}"
                    >
                        delete
                    </button>
                </div>
            {/each}
        </div>
    </div>
    <PcKeyboardInput key="Escape" keyDown="{toggleModal}" />
{/if}

<style>
    /* The Modal (background) */
    .modal {
        position: fixed;
        z-index: 1;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
    }

    /* Modal Content/Box */
    .modal-content {
        background-color: #ffffffb7;
        margin: 15% auto;
        padding: 30px;
        border: 1px solid #888;
        border-radius: 8px;
        width: 400px;
        max-height: 70%;
        overflow-y: auto;
    }

    .heading {
        text-align: left;
        display: grid;
        grid-template-columns: auto min-content;
        padding: 0 0 30px 0;
    }

    .close {
        font-size: 24px;
        font-weight: bold;
    }

    .recording {
        margin-bottom: 10px;
        display: grid;
        grid-template-columns: auto 100px 100px;
        align-items: center;
        text-align: left;
    }
</style>
