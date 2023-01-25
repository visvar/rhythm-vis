<script>
  import Recorder from './components/recorder/Recorder.svelte';
  import Analyzer from './components/analysis/Analyzer.svelte';
  import Tabs from './components/common/Tabs.svelte';
  import MidiIndicator from './components/setup/MidiIndicator.svelte';
  import VolumeMeter from './components/setup/VolumeMeter.svelte';

  const views = ['Recording', 'Analysis', 'Setup', 'Help'];
  let view = localStorage.getItem('view') ?? 'Recording';
  $: {
    localStorage.setItem('view', view);
  }

  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }

  // file system access
  let dataDirectoryHandle = null;
  const selectDir = async () => {
    const handle = await window.showDirectoryPicker();
    console.log(handle);
    if (!handle) {
      return;
    }
    dataDirectoryHandle = handle;
  };
</script>

<main>
  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !dataDirectoryHandle}
    <button on:click="{selectDir}">Set recording directory</button>
  {:else}
    <div>Data directoy: {dataDirectoryHandle.name}</div>
    <Tabs options="{views}" bind:value="{view}" />
    {#if view === 'Recording'}
      <Recorder dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Analysis'}
      <Analyzer dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Setup'}
      <h2>Setup</h2>
      <VolumeMeter />
      <MidiIndicator />
    {:else}
      <h2>How to use</h2>
      <div>
        <b>Audio:</b> If you want to record audio, make sure the correct audio
        input is selected in your browser. You can test this in the <i>Setup</i>
        tab.
      </div>
      <div>
        <b>MIDI:</b>
        If you want to record MIDI, make sure your browser supports
        <a href="https://caniuse.com/midi" target="_blank" rel="noreferrer"
          >Web MIDI</a
        >. You can test whether everything works in the <i>Setup</i> tab or in
        more detail with
        <a
          href="https://github.com/fheyen/midi-pianoroll"
          target="_blank"
          rel="noreferrer">this tool</a
        >.
      </div>
      <div>
        Press <i>start</i> to start recording, <i>stop</i> to stop it, then download
        the audio and MIDI files.
      </div>
      <div>
        No data will be send, it completely remains under your control until you
        submit it to us.
      </div>
    {/if}
  {/if}
</main>

<style>
</style>
