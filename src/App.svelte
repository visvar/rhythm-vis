<script>
  import Recorder from './components/RecorderWithMetronome.svelte';
  import Analyzer from './components/Analyzer.svelte';
  import Tabs from './components/Tabs.svelte';
  import MidiIndicator from './components/MidiIndicator.svelte';
  import VolumeMeter from './components/VolumeMeter.svelte';

  const views = ['Recording', 'Analysis', 'Setup'];
  let view = localStorage.getItem('view') ?? 'Recording';
  $: {
    localStorage.setItem('view', view);
  }

  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }
</script>

<main>
  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else}
    <Tabs options="{views}" bind:value="{view}" />
    {#if view === 'Recording'}
      <Recorder />
    {:else if view === 'Analysis'}
      <Analyzer />
    {:else}
      <div>
        <VolumeMeter />
        <MidiIndicator />
      </div>
    {/if}
  {/if}
</main>

<style>
</style>
