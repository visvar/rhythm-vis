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
</script>

<main>
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
</main>

<style>
</style>
