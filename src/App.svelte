<script>
  import Recorder from './components/recorder/Recorder.svelte';
  import Analyzer from './components/analysis/Analyzer.svelte';
  import Tabs from './components/common/Tabs.svelte';
  import MidiIndicator from './components/setup/MidiIndicator.svelte';
  import VolumeMeter from './components/setup/VolumeMeter.svelte';
  import Help from './components/help/Help.svelte';
  import Converter from './components/converter/Converter.svelte';
  import Live from './components/realtime/Live.svelte';
  import Recordings from './components/recordings/Recordings.svelte';

  const views = [
    'Recording',
    'Analysis',
    'Setup',
    'Converter',
    'Live',
    'Recordings',
    'Help',
  ];
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
    <Tabs options="{views}" bind:value="{view}" />
    {#if view === 'Recording'}
      <Recorder dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Analysis'}
      <Analyzer dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Setup'}
      <h2>Setup</h2>
      <VolumeMeter />
      <MidiIndicator />
    {:else if view === 'Live'}
      <Live />
    {:else if view === 'Recordings'}
      <Recordings dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Converter'}
      <Converter dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else}
      <Help />
    {/if}
  {/if}
</main>

<style>
</style>
