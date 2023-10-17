<script>
  import Playground from './Playground.svelte';
  import Study from './Study.svelte';
  import Analysis from './Analysis.svelte';

  // let view = 'study';
  let view = 'analysis';
</script>

<main>
  <h1>Rhythm Error Perception Study</h1>

  <div>
    <button on:click="{() => (view = 'playground')}">Playground</button>
    <button on:click="{() => (view = 'study')}">Study</button>
    <button on:click="{() => (view = 'analysis')}">Analysis</button>
  </div>

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'study'}
    <Study />
  {:else if view === 'analysis'}
    <Analysis />
  {/if}

  <!-- <StaircaseTest /> -->
</main>

<style>
</style>
